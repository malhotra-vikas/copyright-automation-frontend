export interface Task {
  id: string
  name: string
  description: string
  status: string
  priority: {
    priority: string
    color: string
  } | null
  url: string
  list: {
    id: string
    name: string
  }
}


export interface Company {
  id: string
  name: string
  description: string
  industry: string
  foundedYear: number
  website: string
  logoUrl?: string
  aboutCompany: string
  cautionaryNote: string
  companyDescriptor: string
  ceoName: string
  contactName: string
  contactEmail: string
  irContactName: string
  irContactEmail: string
  irContactPhone: string
  irCompanyName: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "companyUser"
  active: boolean
  company?: Company
}

export interface VaultFile {
  createdAt: string | number | Date
  createdDate: any
  _id: string
  originalName: string
  docType: string
  extractedTextLink: string
  uploadedDate: string
  serverFileName: string
  type: string
  mimetype: string
  size: number
  filePath: string
  uploadDate: Date
  category: string
}

export interface PriceMovement {
    percentage: number;
    movement: "Up" | "Down";
}

export interface Competitor {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changesPercentage: number;
    link: string;
}

export interface EarningsEvent {
  symbol: any
  date: string
  time: string

  eps: string
  epsEstimated: string
  revenue: string
  revenueEstimated: string
  fiscalDateEnding: string
}

export interface EarningsCalendarProps {
    events: EarningsEvent[]
    isLoading?: boolean
}

export interface NewsItem {
  link: string | undefined
  source: string
  time: string
  title: string
  image: string
}

export interface NewsSectionProps {
  data: NewsItem[]
  isLoading?: boolean
  isTwitterConnected?: boolean
  isLinkedInConnected?: boolean
}

export interface HubData {
  competitors: Competitor[]
  earningsCalendar: EarningsEvent[]
  companyNews: NewsItem[]
  compititionNews: NewsItem[]
  trendingNews: NewsItem[]
  industryNews: NewsItem[]
}
