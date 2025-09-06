import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface UserKarma {
  totalKarma: number;
  postKarma: number;
  commentKarma: number;
  voteKarma: number;
  level: string;
}

const KARMA_ACTIONS = {
  CREATE_POST: 10,
  RECEIVE_UPVOTE: 5,
  RECEIVE_DOWNVOTE: -2,
  GIVE_UPVOTE: 1,
  COMMENT: 3,
  RECEIVE_COMMENT: 2
};

const KARMA_LEVELS = [
  { min: 0, max: 49, level: "Intern", color: "text-gray-500" },
  { min: 50, max: 149, level: "Resident", color: "text-blue-500" },
  { min: 150, max: 299, level: "Fellow", color: "text-green-500" },
  { min: 300, max: 499, level: "Attending", color: "text-purple-500" },
  { min: 500, max: 999, level: "Senior Doctor", color: "text-orange-500" },
  { min: 1000, max: Infinity, level: "Chief of Medicine", color: "text-red-500" }
];

export const useKarma = () => {
  const [karma, setKarma] = useState<UserKarma>({
    totalKarma: 0,
    postKarma: 0,
    commentKarma: 0,
    voteKarma: 0,
    level: "Intern"
  });

  useEffect(() => {
    const savedKarma = localStorage.getItem('userKarma');
    if (savedKarma) {
      setKarma(JSON.parse(savedKarma));
    }
  }, []);

  const updateKarma = (action: keyof typeof KARMA_ACTIONS, showToast = true) => {
    const points = KARMA_ACTIONS[action];
    
    setKarma(prev => {
      const newKarma = {
        ...prev,
        totalKarma: prev.totalKarma + points,
        postKarma: action === 'CREATE_POST' ? prev.postKarma + points : prev.postKarma,
        commentKarma: action === 'COMMENT' || action === 'RECEIVE_COMMENT' ? prev.commentKarma + points : prev.commentKarma,
        voteKarma: action.includes('VOTE') ? prev.voteKarma + points : prev.voteKarma,
        level: getLevel(prev.totalKarma + points)
      };
      
      localStorage.setItem('userKarma', JSON.stringify(newKarma));
      
      if (showToast && points > 0) {
        toast({ 
          title: `+${points} Karma!`, 
          description: `${action.replace('_', ' ').toLowerCase()} • Total: ${newKarma.totalKarma}` 
        });
      }
      
      return newKarma;
    });
  };

  const getLevel = (totalKarma: number) => {
    const level = KARMA_LEVELS.find(l => totalKarma >= l.min && totalKarma <= l.max);
    return level?.level || "Intern";
  };

  const getLevelColor = (level: string) => {
    const levelData = KARMA_LEVELS.find(l => l.level === level);
    return levelData?.color || "text-gray-500";
  };

  return { karma, updateKarma, getLevelColor };
};