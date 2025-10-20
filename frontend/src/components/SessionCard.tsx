import { Session } from '../types';

export default function SessionCard({ session, onAction }: { session: Session; onAction?: (action: string) => void }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow flex items-center justify-between">
      <div>
        <div className="font-semibold">{session.skillTopic}</div>
        <div className="text-sm text-gray-600">with {session.partnerName}</div>
        <div className="text-sm text-gray-500">{new Date(session.scheduledTime).toLocaleString()}</div>
        <div className="text-xs text-gray-400">Status: {session.status}</div>
      </div>
      {onAction && (
        <div className="flex gap-2">
          {session.status === 'PENDING' && (
            <>
              <button onClick={() => onAction('CONFIRMED')} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Confirm</button>
              <button onClick={() => onAction('CANCELLED')} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Cancel</button>
            </>
          )}
          {session.status === 'CONFIRMED' && (
            <button onClick={() => onAction('COMPLETED')} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Mark Completed</button>
          )}
        </div>
      )}
    </div>
  );
}
