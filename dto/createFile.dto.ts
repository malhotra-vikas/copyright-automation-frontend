import * as yup from "yup";

export class CreateFileDto {
  fileName?: string;
  fileContent?: string;
  user_id?: string;
  docType?: string;

  static yupSchema() {
    const restrictedKeywords = [
      "con",
      "aux",
      "prn",
      "nul",
      "com1",
      "com2",
      "com3",
      "lpt1",
      "lpt2",
      "lpt3",
    ];

    const fileNameSchema = yup
      .string()
      .required("File name is required")
      .nullable()
      .test(
        "valid-filename",
        "Invalid file name: contains special characters, restricted keywords, trailing spaces, or exceeds 255 characters.",
        (value) => {
          if (!value) return false;
          const trimmedValue = value.trim();
          return (
            trimmedValue === value &&
            trimmedValue.length <= 255 &&
            !/[<>:"/\\|?*]/.test(trimmedValue) &&
            !restrictedKeywords.includes(trimmedValue.toLowerCase())
          );
        },
      );

    return yup.object({
      fileName: fileNameSchema,
      fileContent: yup
        .string()
        .required("Please Provide File Content")
        .test(
          "valid-filecontent",
          "Please remove the extra space",
          function (value) {
            return value ? !/^\s|\s$|\s{2,}/.test(value) : true;
          },
        )
        .nullable(),
    });
  }
}
