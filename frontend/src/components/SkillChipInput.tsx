import { useState } from 'react';

interface Props {
  skills: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
}

export default function SkillChipInput({ skills, onChange, placeholder }: Props) {
  const [input, setInput] = useState('');

  const addSkill = () => {
    if (input.trim() && !skills.includes(input.trim())) {
      onChange([...skills, input.trim()]);
      setInput('');
    }
  };

  const removeSkill = (skill: string) => {
    onChange(skills.filter(s => s !== skill));
  };

  return (
    <div className="border border-gray-300 rounded-lg p-3">
      <div className="flex flex-wrap gap-2 mb-2">
        {skills.map(skill => (
          <span key={skill} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-2">
            {skill}
            <button onClick={() => removeSkill(skill)} className="text-purple-600 hover:text-purple-800">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          placeholder={placeholder}
          className="flex-1 border-none outline-none"
        />
        <button onClick={addSkill} className="bg-purple-600 text-white px-4 py-1 rounded-lg hover:bg-purple-700">
          Add
        </button>
      </div>
    </div>
  );
}
