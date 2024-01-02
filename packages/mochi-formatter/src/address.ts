import functions from "./functions";
import {
  NameRegistryState,
  getHashedNameSync,
  getNameAccountKeySync,
  reverseLookup as performReverseLookup,
} from "@bonfida/spl-name-service";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { isAddress as isValidEvmAddress, JsonRpcProvider } from "ethers";
import time from "./time";
import UI from "./index";

const eth = new JsonRpcProvider("https://eth.llamarpc.com", 1);
const connection = new Connection(clusterApiUrl("mainnet-beta"));
const SOL_TLD_AUTHORITY = new PublicKey(
  "58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx"
);

async function resolveSNSDomain(domain: string) {
  const hashedName = getHashedNameSync(domain.replace(".sol", ""));
  const nameAccountKey = getNameAccountKeySync(
    hashedName,
    undefined,
    SOL_TLD_AUTHORITY
  );
  const owner = await NameRegistryState.retrieve(
    new Connection(clusterApiUrl("mainnet-beta")),
    nameAccountKey
  );
  return owner.registry.owner.toBase58();
}

async function resolveENSDomain(domain: string) {
  return await eth.resolveName(domain);
}

type ResolveLookupBaseOptions = {
  waitFor?: number;
};

async function resolveDomains(
  domain: string,
  options?: Partial<ResolveLookupBaseOptions>
) {
  const cacheKey = `GET resolveDomains/${domain}`;

  const racers = [
    doResolve(domain).then((addr) => (UI.redis?.set(cacheKey, addr), addr)),
    time.wait(options?.waitFor ?? 500).then(() => domain),
    time
      .wait(options?.waitFor ?? 0)
      .then(
        () => UI.redis?.get(cacheKey).then((addr) => addr ?? domain) ?? domain
      ),
  ];

  return await Promise.race(racers);
}

async function doResolve(domain: string) {
  try {
    if (domain.endsWith(".sol")) {
      return await resolveSNSDomain(domain);
    }
    return (await resolveENSDomain(domain)) || domain;
  } catch (e) {
    return "";
  }
}

async function lookUpDomains(
  address: string,
  options?: Partial<ResolveLookupBaseOptions & { shorten: boolean }>
) {
  const cacheKey = `GET lookupDomains/${address}`;
  const shortenAddress = options?.shorten ?? true ? shorten(address) : address;

  const racers = [
    doLookup(address, options?.shorten ?? true).then(
      (domain) => (UI.redis?.set(cacheKey, domain), domain)
    ),
    time.wait(options?.waitFor ?? 500).then(() => shortenAddress),
    time
      .wait(options?.waitFor ?? 0)
      .then(
        () =>
          UI.redis?.get(cacheKey).then((domain) => domain ?? shortenAddress) ??
          shortenAddress
      ),
  ];

  return await Promise.race(racers);
}

async function doLookup(_address: string, shortenAddr: boolean) {
  const { chainType } = isAddress(_address);
  const address = shortenAddr ? shorten(_address) : _address;
  try {
    switch (chainType) {
      case AddressChainType.SOL: {
        const domainKey = new PublicKey(_address);
        return await performReverseLookup(connection, domainKey);
      }
      case AddressChainType.EVM:
        return (await eth.lookupAddress(_address)) || address;
      default:
        return address;
    }
  } catch (e) {
    return address;
  }
}

function shorten(val: string, len = 5, lenRight = 4) {
  if (!val) return "";
  return `${val.slice(0, len)}\.\.${val.slice(val.length - lenRight)}`;
}

function isShorten(address: string): address is `${string}..${string}` {
  return /.+\.\..+/g.test(address.trim());
}

/*
 * This function will attempt to convert address to more human-friendly form
 * e.g. remove "ronin:" prefix of ronin addresses
 */
function normalizeAddress(address: string) {
  return functions.pipe(address, function ronin(a) {
    if (a.toLowerCase().startsWith("ronin:")) {
      return a.slice("ronin:".length);
    }
    return a;
  });
}

function isHex(value: string): boolean {
  return /^(0x|0X)?[a-fA-F0-9]+$/.test(value) && value.length % 2 === 0;
}

function getHexByteLength(value: string): number {
  return /^(0x|0X)/.test(value) ? (value.length - 2) / 2 : value.length / 2;
}

function isValidSuiAddress(value: string): boolean {
  const SUI_ADDRESS_LENGTH = 32;
  return isHex(value) && getHexByteLength(value) === SUI_ADDRESS_LENGTH;
}

function isValidRoninAddress(value: string): boolean {
  return value.length === 46 && value.toLowerCase().startsWith("ronin:");
}

export enum AddressChainType {
  EVM = "evm-chain",
  SOL = "solana-chain",
  SUI = "sui-chain",
  RON = "ronin-chain",
  APT = "aptos-chain",
  NEAR = "near-chain",
  UNKNOWN = "",
}

function isAddress(address: string | null = ""): {
  valid: boolean;
  chainType: AddressChainType;
} {
  if (!address) return { valid: false, chainType: AddressChainType.UNKNOWN };
  try {
    if (isValidEvmAddress(address)) {
      return {
        valid: true,
        chainType: AddressChainType.EVM,
      };
    }
    if (isValidRoninAddress(address)) {
      return { valid: true, chainType: AddressChainType.RON };
    }
    if (isValidSuiAddress(address)) {
      return { valid: true, chainType: AddressChainType.SUI };
    }
    if (PublicKey.isOnCurve(new PublicKey(address))) {
      return { valid: true, chainType: AddressChainType.SOL };
    }
  } catch (e) {
    return { valid: false, chainType: AddressChainType.UNKNOWN };
  }
  return { valid: false, chainType: AddressChainType.UNKNOWN };
}

export default {
  shorten,
  isShorten,
  isAddress,
  normalizeAddress,
  resolve: resolveDomains,
  lookup: lookUpDomains,
};
