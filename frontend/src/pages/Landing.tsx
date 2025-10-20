import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
      <div className="text-center px-6">
        <h1 className="text-5xl font-extrabold mb-4">SkillSwap</h1>
        <p className="text-xl mb-8 max-w-xl mx-auto">Exchange knowledge, grow your skills, and meet peers who can teach what you want to learn.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/register" className="bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-purple-100">Get Started</Link>
          <Link to="/login" className="bg-transparent border border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-700">Login</Link>
        </div>
      </div>
    </div>
  );
}
