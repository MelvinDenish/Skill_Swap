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
    <div className="border border-gray-300 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 rounded-lg p-3">
      <div className="flex flex-wrap gap-2 mb-2">
        {skills.map(skill => (
          <span key={skill} className="border px-3 py-1 rounded-full flex items-center gap-2 bg-transparent text-gray-700 dark:bg-transparent text-secondary">
            {skill}
            <button onClick={() => removeSkill(skill)} className="text-gray-500 text-tertiary hover:text-gray-700 dark:hover:text-secondary">×</button>
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
          className="flex-1 border-none outline-none bg-transparent dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <button onClick={addSkill} className="btn-outline px-3 py-1 text-sm rounded-lg">
          Add
        </button>
      </div>
    </div>
  );
}
