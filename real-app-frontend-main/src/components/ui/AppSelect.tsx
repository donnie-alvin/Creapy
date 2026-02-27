import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectProps,
} from "@mui/material";

interface AppSelectOption {
  label: string;
  value: string | number;
}

interface AppSelectProps extends SelectProps {
  label?: string;
  options: AppSelectOption[];
}

const AppSelect = ({ label, options, ...props }: AppSelectProps) => {
  const labelId = label ? `${props.name || "app-select"}-label` : undefined;
  return (
    <FormControl fullWidth size={props.size || "medium"}>
      {label && <InputLabel id={labelId}>{label}</InputLabel>}
      <Select labelId={labelId} label={label} {...props}>
        {options.map((option) => (
          <MenuItem key={`${option.value}`} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default AppSelect;
