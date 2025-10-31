import { Match } from '../types';
import { useNavigate } from 'react-router-dom';

export default function MatchCard({ match }: { match: Match }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <img src={match.profilePictureUrl || '/default-avatar.svg'} alt={match.name} className="w-16 h-16 rounded-full" />
        <div>
          <h3 className="text-xl font-bold">{match.name}</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            ⭐ {typeof match.rating === 'number' ? match.rating.toFixed(1) : '—'} -  {match.completedSessions ?? 0} sessions
          </div>
        </div>
        <div className="ml-auto text-3xl font-bold text-indigo-600 dark:text-indigo-300">{match.matchScore}%</div>
      </div>
      
      {(match.matchingSkillsTheyOffer?.length ?? 0) > 0 && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">They can teach you:</div>
          <div className="flex flex-wrap gap-2">
            {(match.matchingSkillsTheyOffer || []).map((skill: string) => (
              <span key={skill} className="border border-gray-300 text-gray-700 bg-transparent dark:border-neutral-800 text-secondary px-2 py-1 rounded text-sm">{skill}</span>
            ))}
          </div>
        </div>
      )}
      
      {(match.matchingSkillsYouOffer?.length ?? 0) > 0 && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">You can teach them:</div>
          <div className="flex flex-wrap gap-2">
            {(match.matchingSkillsYouOffer || []).map((skill: string) => (
              <span key={skill} className="border border-gray-300 text-gray-700 bg-transparent dark:border-neutral-800 text-secondary px-2 py-1 rounded text-sm">{skill}</span>
            ))}
          </div>
        </div>
      )}
      
      <button 
        onClick={() => navigate(`/user/${match.userId}`)}
        className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2 rounded-lg hover:opacity-90 dark:bg-none dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border dark:border-neutral-700"
      >
        View Profile & Connect
      </button>
    </div>
  );
}
