import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { reviewAPI, sessionAPI, userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface ReviewItem {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerProfilePictureUrl?: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function UserProfile() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  // session form
  const [skillTopic, setSkillTopic] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [isTeacher, setIsTeacher] = useState(false);

  // review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [{ data: userData }, { data: reviewsData }] = await Promise.all([
          userAPI.getUser(id),
          reviewAPI.getUserReviews(id),
        ]);
        setProfile(userData);
        setReviews(reviewsData);
      } catch (e) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const createSession = async () => {
    if (!id) return;
    if (!skillTopic || !scheduledTime) {
      toast.error('Please fill skill topic and time');
      return;
    }
    try {
      await sessionAPI.createSession({
        partnerId: id,
        skillTopic,
        scheduledTime,
        duration,
        isTeacher,
      });
      toast.success('Session request sent');
    } catch (e) {
      toast.error('Failed to create session');
    }
  };

  const submitReview = async () => {
    if (!id) return;
    try {
      // Reviews are tied to sessions, but we allow user to rate after completing sessions from Sessions page typically.
      // For simplicity, we do not create a new review here without a session; keep UI display-only for reviews.
      toast.error('Please leave a review from the session completion flow.');
    } catch {
      // noop
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar /><div className="container mx-auto px-4 py-8">Loading...</div></div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-gray-50"><Navbar /><div className="container mx-auto px-4 py-8">User not found</div></div>
  );

  const canBook = user && user.id !== profile.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row gap-6">
          <img src={profile.profilePictureUrl || '/default-avatar.svg'} className="w-32 h-32 rounded-full" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{profile.name}</h1>
            <p className="text-gray-600 mt-2">{profile.bio || 'No bio yet'}</p>
            <div className="flex gap-6 mt-4 text-sm">
              <div><span className="font-semibold">Level:</span> {profile.level}</div>
              <div><span className="font-semibold">Rating:</span> {profile.rating?.toFixed(1)} ⭐</div>
              <div><span className="font-semibold">Sessions:</span> {profile.completedSessions}</div>
            </div>
            <div className="mt-4">
              <div className="font-semibold">Availability:</div>
              <div className="text-gray-700">{profile.availability || 'Not specified'}</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-3">Skills Offered</h2>
            <div className="flex flex-wrap gap-2">
              {(profile.skillsOffered || []).map((s: string) => (
                <span key={s} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{s}</span>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-3">Skills Wanted</h2>
            <div className="flex flex-wrap gap-2">
              {(profile.skillsWanted || []).map((s: string) => (
                <span key={s} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {canBook && (
          <div className="bg-white rounded-xl shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Request a Session</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Skill Topic</label>
                <input value={skillTopic} onChange={(e) => setSkillTopic(e.target.value)} className="w-full border rounded p-2" placeholder="e.g., React Basics" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date & Time</label>
                <input type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value || '60', 10))} className="w-full border rounded p-2" />
              </div>
              <div className="flex items-center gap-2">
                <input id="isTeacher" type="checkbox" checked={isTeacher} onChange={(e) => setIsTeacher(e.target.checked)} />
                <label htmlFor="isTeacher">I will teach</label>
              </div>
            </div>
            <button onClick={createSession} className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg">Send Request</button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-gray-600">No reviews yet</div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="border-b pb-3">
                  <div className="flex items-center gap-3">
                    <img src={r.reviewerProfilePictureUrl || '/default-avatar.svg'} className="w-8 h-8 rounded-full" />
                    <div className="font-semibold">{r.reviewerName}</div>
                    <div className="text-yellow-600">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                  </div>
                  <div className="text-gray-700 mt-2">{r.comment}</div>
                  <div className="text-gray-400 text-xs mt-1">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
