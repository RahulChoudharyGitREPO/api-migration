export const defaults = {
  //any change here should also be done in apps/web/src/config/formElementsConfig.js
  Title: {
    text: "Title",
    alignment: "left",
    color: "#111827",
    fontSize: 24,
    fontWeight: 700,
    defaultValue: "", // For titles, this could be used for dynamic content
  },
  Box: {
    height: "auto",
    minHeight: 150,
    width: "100",
    widthUnit: "%",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    defaultValue: "", // Not typically used for containers
  },
  Input: {
    label: "Input Field",
    placeholder: "Enter text here...",
    required: false,
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    borderRadius: 6,
    borderColor: "#DEDEDE",
    backgroundColor: "#ffffff",
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    defaultValue: "", // Pre-filled text value
  },
  Email: {
    label: "Email",
    placeholder: "Enter email here...",
    required: false,
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    borderRadius: 6,
    borderColor: "#DEDEDE",
    backgroundColor: "#ffffff",
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    defaultValue: "", // Pre-filled email value
  },
  Number: {
    label: "Input number",
    placeholder: "Enter number here...",
    required: false,
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    borderRadius: 6,
    borderColor: "#DEDEDE",
    backgroundColor: "#ffffff",
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    defaultValue: "", // Pre-filled number value
  },
  Date: {
    label: "Date",
    placeholder: "Choose date",
    required: false,
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    borderRadius: 6,
    borderColor: "#DEDEDE",
    backgroundColor: "#ffffff",
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    defaultValue: "", // Pre-selected date in YYYY-MM-DD format
  },
  Time: {
    label: "Time",
    placeholder: "Choose time",
    required: false,
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    borderRadius: 6,
    borderColor: "#DEDEDE",
    backgroundColor: "#ffffff",
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    defaultValue: "", // Pre-selected time in HH:MM format
  },
  Dropdown: {
    label: "Dropdown",
    placeholder: "Select an option",
    required: false,
    options: ["Option 1", "Option 2", "Option 3"],
    width: "100",
    widthUnit: "%",
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    defaultValue: "", // Pre-selected option value
  },
  State: {
    label: "State",
    required: false,
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    defaultValue: "", // Pre-selected state
  },
  District: {
    label: "District",
    required: false,
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    defaultValue: "", // Pre-selected district
  },
  Taluk: {
    label: "Taluk",
    required: false,
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    defaultValue: "", // Pre-selected taluk
  },
  Village: {
    label: "Village",
    required: false,
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    defaultValue: "", // Pre-selected village
  },
  Textarea: {
    label: "Text Area",
    placeholder: "Enter text here...",
    required: false,
    rows: 4,
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    borderRadius: 6,
    borderColor: "#DEDEDE",
    backgroundColor: "#ffffff",
    defaultValue: "", // Pre-filled text content
  },
  Radio: {
    label: "Choose an option",
    width: "100",
    widthUnit: "%",
    required: false,
    options: [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
    ],
    name: `radio-group-name-ai`,
    selectedValue: "", // This is actually the default value for radio
    layout: "vertical",
    labelFontSize: 16,
    labelColor: "#1f2937",
    labelFontWeight: "semibold",
    optionLabelFontSize: 14,
    optionLabelColor: "#374151",
    optionLabelFontWeight: "normal",
    optionControlSize: "normal",
    optionAccentColor: "#3b82f6",
    defaultValue: "", // Pre-selected radio option value
  },
  Checkbox: {
    label: "Select applicable options",
    options: [
      { value: "option1", label: "Option 1", checked: false },
      { value: "option2", label: "Option 2", checked: false },
    ],
    width: "100",
    widthUnit: "%",
    layout: "vertical",
    labelFontSize: 16,
    labelColor: "#1f2937",
    labelFontWeight: "semibold",
    optionLabelFontSize: 14,
    optionLabelColor: "#374151",
    optionLabelFontWeight: "normal",
    optionControlSize: "large",
    optionAccentColor: "#3b82f6",
    required: false,
    defaultValue: "", // Note: For checkboxes, default values are managed through options[].checked
  },
  Switch: {
    label: "Switch",
    width: "100",
    widthUnit: "%",
    labelFontSize: 16,
    labelColor: "#1f2937",
    labelFontWeight: "semibold",
    optionControlSize: "normal",
    optionAccentColor: "#3b82f6",
    required: false,
    defaultValue: false, // Boolean: true for on, false for off
  },
  GeoTag: {
    label: "Geo tag",
    required: false,
    width: "100",
    widthUnit: "%",
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    defaultValue: "", // Format: "latitude,longitude" (e.g., "40.7128,-74.0060")
  },
  FileUploader: {
    label: "File Upload",
    placeholder: "Choose file",
    accept: "*/*",
    required: false,
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
    defaultValue: "", // Optional: default file path or URL for display
  },
  Spacer: {
    height: 4,
    defaultValue: "", // Not applicable for spacers
  },
  SerialNumber: {
    label: "Serial number",
    prefix: "",
    suffix: "",
    startNumber: "001",
    increment: 1,
    useDate: false,
    useTime: false,
    dateFormat: "DD-MM-YYYY",
    timeFormat: "HH:mm",
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    borderRadius: 6,
    borderColor: "#DEDEDE",
    backgroundColor: "#ffffff",
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
  },
  VirtualField: {
    label: "Virtual Field",
    formula: "",
    rules: [],
    width: "100",
    widthUnit: "%",
    fontSize: 14,
    borderRadius: 6,
    borderColor: "#DEDEDE",
    backgroundColor: "#ffffff",
    labelFontSize: 14,
    labelColor: "#374151",
    labelFontWeight: "medium",
    labelMarginBottom: 4,
  },
};

export function normalizeSchema(schema: any[]): any[] {
  if (!Array.isArray(schema)) return [];

  return schema
    .filter((el) => el.type && defaults[el.type]) // only allowed
    .map((el, idx) => {
      const base = defaults[el.type];
      const userProps = el.properties || {};

      return {
        id: el.id || `field_${idx + 1}`, // auto ID if missing
        type: el.type,
        properties: {
          ...base, // default props
          ...userProps, // override with GPT/user props
        },
      };
    });
}