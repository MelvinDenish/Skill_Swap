import { Match } from '../types';
import { useNavigate } from 'react-router-dom';

export default function MatchCard({ match }: { match: Match }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <img src={match.profilePictureUrl || '/default-avatar.svg'} alt={match.name} className="w-16 h-16 rounded-full" />
        <div>
          <h3 className="text-xl font-bold">{match.name}</h3>
          <div className="text-sm text-gray-600">
            ⭐ {match.rating.toFixed(1)} -  {match.completedSessions} sessions
          </div>
        </div>
        <div className="ml-auto text-3xl font-bold text-purple-600">{match.matchScore}%</div>
      </div>
      
      {match.matchingSkillsTheyOffer.length > 0 && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-green-700 mb-1">They can teach you:</div>
          <div className="flex flex-wrap gap-2">
            {match.matchingSkillsTheyOffer.map(skill => (
              <span key={skill} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{skill}</span>
            ))}
          </div>
        </div>
      )}
      
      {match.matchingSkillsYouOffer.length > 0 && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-blue-700 mb-1">You can teach them:</div>
          <div className="flex flex-wrap gap-2">
            {match.matchingSkillsYouOffer.map(skill => (
              <span key={skill} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{skill}</span>
            ))}
          </div>
        </div>
      )}
      
      <button 
        onClick={() => navigate(`/user/${match.userId}`)}
        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:opacity-90"
      >
        View Profile & Connect
      </button>
    </div>
  );
}
