import * as yup from "yup";

export class VerifyUserDto {
  password?: string;
  confirm_password?: string;
  keycloak_id?: string;
  username?: string;
  static yupSchema() {
    return yup.object({
      password: yup
        .string()
        .min(8, "Password must be at least 8 characters long")
        .required("Please Enter Your Password")
        .test("valid-password", "Please remove extra spaces", function (value) {
          return value ? !/^\s|\s$|\s{2,}/.test(value) : true;
        })
        .nullable(),

      confirm_password: yup
        .string()
        .required("Please Enter Confirm Password")
        .oneOf([yup.ref("password")], "Passwords must match")
        .test(
          "valid-confirm-password",
          "Please remove extra spaces",
          function (value) {
            return value ? !/^\s|\s$|\s{2,}/.test(value) : true;
          },
        )
        .nullable(),
    });
  }
}
