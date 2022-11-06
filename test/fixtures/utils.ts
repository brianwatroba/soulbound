import { ethers } from "hardhat";
import { BigNumber } from "ethers";

export const encodeTokenIdJs = (tokenType: BigNumber, address: string) => {
  const packed = ethers.utils.solidityPack(["uint96", "address"], [tokenType, address]);
  return packed;
};

export const randomIntFromInterval = (min: number, max: number) => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const arrayOfSingleNumber = (length: number, number: number) => {
  return Array.from({ length }, () => number);
};

export const arrayOfSingleString = (length: number, string: string) => {
  return Array.from({ length }, () => string);
};

export const arrayOfNums = (max: number) => {
  return [...Array(max).keys()];
};
