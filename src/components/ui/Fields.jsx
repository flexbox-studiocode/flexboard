import { useId } from 'react'
import { ChevronDown, Search } from 'lucide-react'

function Field({ as: Tag = 'input', label, hint, error, id: suppliedId, className = '', leadingIcon, ...props }) {
  const generatedId = useId()
  const id = suppliedId || generatedId
  const description = [hint && `${id}-hint`, error && `${id}-error`, props['aria-describedby']].filter(Boolean).join(' ') || undefined
  const singleSelect = Tag === 'select' && !props.multiple && !(Number(props.size) > 1)
  const control = <Tag {...props} id={id} aria-invalid={error ? true : undefined} aria-describedby={description} />
  return <div className={`field ${className}`}>
    {label && <label htmlFor={id}>{label}</label>}
    {singleSelect || leadingIcon ? <div className={`field__control${leadingIcon ? ' field__control--leading-icon' : ''}${singleSelect ? ' field__control--select' : ''}`}>
      {leadingIcon && <span className="field__leading-icon" aria-hidden="true">{leadingIcon}</span>}
      {control}
      {singleSelect && <ChevronDown className="field__chevron" size={20} aria-hidden="true" />}
    </div> : control}
    {hint && <small id={`${id}-hint`} className="field__hint">{hint}</small>}
    {error && <small id={`${id}-error`} className="field__error" role="alert">{error}</small>}
  </div>
}

export function Input(props) { return <Field {...props} /> }
export function Textarea(props) { return <Field {...props} as="textarea" /> }
export function Select(props) { return <Field {...props} as="select" /> }
export function Checkbox({ label, hint, id: suppliedId, className = '', ...props }) {
  const generatedId = useId()
  const id = suppliedId || generatedId
  return <div className={`checkbox-field ${className}`}>
    <input {...props} id={id} type="checkbox" aria-describedby={hint ? `${id}-hint` : undefined} />
    <div><label htmlFor={id}>{label}</label>{hint && <small id={`${id}-hint`} className="field__hint">{hint}</small>}</div>
  </div>
}
export function SearchField({ label = 'Cari tugas', ...props }) {
  return <Input {...props} label={label} type="search" leadingIcon={<Search size={19} />} />
}
