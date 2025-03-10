import { TwitterDto } from "@/dto/twitter.dto";
import BaseApi from "./_baseApi";
import { date } from "yup";

export default class TwitterApi extends BaseApi {

  baseUrl: string = "twitter/";
  getUniqueFieldValues: any;
  constructor() {
    super();
  }

  async getTwitterAccountByUserId(userId: string) {
    const response = await TwitterApi.get(`${this.baseUrl}status`, {
      params: { userId: userId }, // Pass `_id` as a query param
    });
    return response.data;
  }


}
