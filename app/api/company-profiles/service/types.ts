import { ObjectId } from "mongodb";

export interface CompanyProfileDoc {
  _id: ObjectId;
  symbol: string;
  image: string;
  companyName: string;
  sector: string;
  industry: string;
  country: string;
  marketCap: number;
  price: number;
  change: number;
  volume: number;
}

export interface Company {
  _id: string; // stringified for the UI
  symbol: string;
  image: string;
  companyName: string;
  sector: string;
  industry: string;
  country: string;
  marketCap: number;
  price: number;
  change: number;
  volume: number;
}

export const mapProfileToCompany = (d: CompanyProfileDoc): Company => ({
  ...d,
  _id: d._id.toHexString(),
});
