import { ObjectId } from "mongodb";

/** Mongo shape */
export interface StockScreenerDoc {
  _id: ObjectId;
  symbol: string;
  companyName: string;
  marketCap: number;
  sector: string;
  industry: string;
  price: number;
  volume: number;
  country: string;
  exchange: string;
  beta: number;
  isActivelyTrading: boolean;
  modifiedAt: Date;
}

/** UI shape */
export interface StockScreener {
  _id: string;
  symbol: string;
  companyName: string;
  marketCap: number;
  sector: string;
  industry: string;
  price: number;
  volume: number;
  country: string;
  exchange: string;
  beta: number;
  isActivelyTrading: boolean;
}

export const mapScreenerToUi = (d: StockScreenerDoc): StockScreener => ({
  ...d,
  _id: d._id.toHexString(),
});
