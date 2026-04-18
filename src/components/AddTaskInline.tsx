import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import './AddTaskInline.css';

interface AddTaskInlineProps {
  onAdd: (text: string) => void;
  placeholder?: string;
  colorClass?: string;
}

const AddTaskInline: React.FC<AddTaskInlineProps> = ({ 
  onAdd, 
  placeholder = "Add a task...",
  colorClass = "level-1"
}) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <form 
      className={`add-task-inline ${isFocused ? 'focused' : ''} ${colorClass}`} 
      onSubmit={handleSubmit}
    >
      <div className="add-task-icon">
        <Plus size={20} />
      </div>
      <input
        type="text"
        className="add-task-input"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </form>
  );
};

export default AddTaskInline;
