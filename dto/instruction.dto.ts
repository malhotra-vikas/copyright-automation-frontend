import * as yup from "yup";

export class UpdateInstructionDto {
  PRchatInstruction?: string;
  ECSchatInstruction?: string;
  QnAchatInstruction?: string;

  static yupSchema() {
    return yup.object({
      PRchatInstruction: yup.string().nullable(),
      ECSchatInstruction: yup.string().nullable(),
      QnAchatInstruction: yup.string().nullable(),
    });
  }
}
