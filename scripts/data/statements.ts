export type Statement = {
  id: string;
  statement: string;
  image: string;
  topics: string;
  options: string[];
  maturity: number;
  prediction: string;
};
export const statements: Statement[] = [
  {
    id: "GermanyParliamentaryElection2025",
    statement: "Parliamentary Election Winner in Germany.",
    options: ["CDU/CSU", "AFD", "SPD", "Greens", "BSW", "FDP", "Other"],
    topics: "politics germany",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738155110/GERMANY_knvzey.png",
    maturity: 1740268800,
    prediction: "CDU/CSU",
  },
  {
    id: "Canadianfederalelection2025",
    statement: "Canadian federal election will take place before October 20.",
    options: ["yes", "no"],
    topics: "politics canada",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738155109/Canadian_tl941j.png",
    maturity: 1760918400,
    prediction: "yes",
  },
  {
    id: "EcuadorElection2025",
    statement: "Winner of Ecuador's Presidential Election.",
    options: [
      "Daniel Noboa",
      "Luisa González",
      "Gustavo Jalkh",
      "Henry Cucalón",
      "Jan Topic",
    ],
    topics: "politics ecuador",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738155109/Ecuador_qiqtdb.png",
    maturity: 1739059200,
    prediction: "Daniel Noboa",
  },
  {
    id: "PolandElection2025",
    statement: "Who will be the next Poland President?",
    options: [
      "Rafał Trzaskowski",
      "Karol Nawrocki",
      "Sławomir Mentzen",
      "Szymon Hołownia",
      "Others",
    ],
    topics: "politics poland",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738155110/Poland_yqktmd.png",
    maturity: 1739059200,
    prediction: "Rafał Trzaskowski",
  },
  {
    id: "UEFAChampions2025",
    statement: "UEFA Champions League Winner.",
    options: [
      "Liverpool",
      "Bayern Munich",
      "Inter Milan",
      "Arsenal",
      "Man City",
      "Real Madrid",
      "Atletico Madrid, Atlanta",
    ],
    topics: "football sports uefa",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738154973/UEFA_ethaz8.png",
    maturity: 1748217600,
    prediction: "Liverpool",
  },
  {
    id: "ArsenalUEFA2025",
    statement: "Arsenal will play UEFA Champions League Final.",
    options: ["yes", "no"],
    topics: "football sports uefa arsenal",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738154973/UEFA-_Arsenal_wzq06u.png",
    maturity: 1744675200,
    prediction: "no",
  },
  {
    id: "LaLigaWinner2025",
    statement: "La Liga Winner",
    options: ["Real Madrid", "Atletico", "Barcelona"],
    topics: "football sports laliga",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738155001/La_Liga_loerhe.png",
    maturity: 1746057600,
    prediction: "Real Madrid",
  },
  {
    id: "EPLWinner2025",
    statement: "EPL Winner.",
    options: [
      "Liverpool",
      "Arsenal",
      "Man City",
      "Chelsea",
      "Nottingham Forest",
      "Newcastle",
    ],
    topics: "football sports epl",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738155146/EPL_uz9dxu.png",
    maturity: 1744675200,
    prediction: "Liverpool",
  },
  {
    id: "EPLTopscorer2025",
    statement: "EPL Top scorer.",
    options: ["Salah", "Haaland", "Isak", "Palmer", "Other"],
    topics: "football sports epl",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738155146/EPL_uz9dxu.png",
    maturity: 1744675200,
    prediction: "Salah",
  },
  {
    id: "GPT5Q12025",
    statement: "GPT 5 would be released in Q1 2025?",
    options: ["yes", "no"],
    topics: "gpt ai technology",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738154989/GPT_timaok.png",
    maturity: 1741996800,
    prediction: "no",
  },
  {
    id: "NvidiaApple2025",
    statement: "Nvidia will flip Apple Market Valuation by end of 2025.",
    options: ["yes", "no"],
    topics: "nvidia apple technology",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738154991/nVidia_zduylq.png",
    maturity: 1761955200,
    prediction: "no",
  },
  {
    id: "SpaceXLaunches2025",
    statement: "How many SpaceX launches by end of 2025?",
    options: [
      "Less than 20",
      "21 - 39",
      "40 - 59",
      "60 - 79",
      "80 -99",
      "100 or more",
    ],
    topics: "space technology spacex",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738154990/SPACE_X_uomned.png",
    maturity: 1764460800,
    prediction: "Less than 20",
  },
  {
    id: "MicroBTC2025",
    statement:
      "Micro strategy will hold at least 500k BTC by end of March 2025.",
    options: ["yes", "no"],
    topics: "crypto assets btc bitcoin",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738155136/Bitcoin_tesct9.png",
    maturity: 1740700800,
    prediction: "yes",
  },
  {
    id: "UnemploymentUSMarch2025",
    statement:
      "Unemployment rate in the United States will fall below 4.1%  by end of March 2025.",
    options: ["yes", "no"],
    topics: "united states usa unemployment",
    image: "",
    maturity: 1741996800,
    prediction: "yes",
  },
  {
    id: "DollarCediMay3035",
    statement:
      "The dollar exchange rate in Ghana will rise to 18 cedis by May 31st 2025.",
    options: ["yes", "no"],
    topics: "ghana dollar cedi",
    image:
      "https://res.cloudinary.com/djyedjeuc/image/upload/v1738155156/Dollar_to_Cedi_zacgo9.png",
    maturity: 1742428800,
    prediction: "no",
  },
];
