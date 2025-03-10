import * as yup from "yup";

export class UploadFileDto {
  UploadFile?: any[];
  static yupSchema() {
    return yup.object({
      UploadFile: yup.array().of(
        yup.object({
          originalName: yup.string().nullable(),
        }),
      ),
    });
  }
}
