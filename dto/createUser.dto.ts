import * as yup from "yup";

export class CreateUserDto {
  companyName?: string;
  email?: string;
  fireBaseUid?: string;
  companyTicker?: string;
  interestTickers?: string[];
  companyExchange?: string;
  companyInfo?: string;
  role?: string;
  
  img?: any;
  userId?: string;
  companyAbout?: string;
  companyCautionaryNote?: string;
  companyCEOName?: string;
  foundedYear?: string;

  companyContactName?: string;
  companyContactEmail?: string;
  companyInvestorRelationsContactName?: string;
  companyInvestorRelationsContactEmail?: string;
  companyInvestorRelationsContactPhone?: string;
  companyInvestorRelationsCompanyName?: string;
  companyDescriptor?: string;

  companyCIK?: string
  companyDescription?: string
  companyIndustry?: string
  companyLogo?: string

  static yupSchema() {
    return yup.object({
      companyName: yup
        .string()
        .required("Please Enter Company Name")
        .test(
          "valid-company-name",
          "Please remove the extra space",
          function (value) {
            return value ? !/^\s|\s$|\s{2,}/.test(value) : true;
            // ^\s checks for leading spaces
            // \s$ checks for trailing spaces
            // \s{2,} checks for consecutive spaces
          },
        )
        .nullable(),
      email: yup
        .string()
        .required("Please Enter Your Email")
        .test(
          "no-spaces-in-email",
          "Email cannot contain spaces",
          function (value) {
            return value ? !/\s/.test(value) : true; // No spaces
          },
        )
        .matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          "Please enter a valid email address",
        )
        .nullable(),
      PRchatInstruction: yup.string().nullable(),
      ECSchatInstruction: yup.string().nullable(),
      QnAchatInstruction: yup.string().nullable(),
      companyInfo: yup.string().nullable(),
    });
  }
}
