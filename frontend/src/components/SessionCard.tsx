import { Session } from '../types';

export default function SessionCard({ session, onAction }: { session: Session; onAction?: (action: string) => void }) {
  return (
    <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg p-4 shadow flex items-center justify-between">
      <div>
        <div className="font-semibold">{session.skillTopic}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">with {session.partnerName}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(session.scheduledTime).toLocaleString()}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500">Status: {session.status}</div>
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
            <>
              <a href={`/sessions/${session.id}/join`} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">Join</a>
              <button onClick={() => onAction('COMPLETED')} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Mark Completed</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
