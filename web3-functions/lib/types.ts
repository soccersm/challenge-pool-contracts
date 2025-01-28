export type CallParams = { target: string; params: any[]; method: any, abi: any };
export type AssetRequests = {
  id: string;
  asset_symbol: string;
  maturity: string;
};

export type FootballRequests = {
  id: string;
  match_id: string;
};


export type CCDATAResp = {
    Response: string;
    Data: { Data: CCDATAOHCLV[]; TimeFrom: number; TimeTo: number };
  };
  
  export type CCDATAOHCLV = {
    time: number;
    high: number;
    low: number;
    open: number;
    close: number;
  };
  
  export type MatchScoreLine = {
    matchId: number;
    homeScore: number;
    awayScore: number;
  };