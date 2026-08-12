import { useId, type ReactNode } from 'react'
import './SelectField.css'

interface SelectFieldProps {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  children: ReactNode
}

function SelectField({
  label,
  value,
  placeholder,
  onChange,
  children,
}: SelectFieldProps) {
  const id = useId()

  return (
    <label className="select-field" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        className="select-field__control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
    </label>
  )
}

export default SelectField
