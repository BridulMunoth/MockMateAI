import React from 'react'
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, FieldValues, Path, Control } from "react-hook-form";

interface FormFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    label: string;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'file';
}

const FormField = <T extends FieldValues>({ control, name, label, placeholder, type ="text" }: FormFieldProps<T>) => (
    <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
            <Field>
                <FieldLabel htmlFor={name} className="label">{label}</FieldLabel>
                <Input
                    id={name}
                    className="input"
                    placeholder={placeholder}
                    type={type}
                    {...field}
                />
                {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
        )}
    />
);

export default FormField;