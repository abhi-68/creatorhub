import { useState } from 'react';

export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  return { values, handleChange, setValues };
}
