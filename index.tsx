import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Loader2, Download,
  X, AlertCircle,
  Check,
  Image as ImageIcon,
  Moon, Sun, Wallet, LogIn,
  ChevronUp, ChevronDown, Wand2,
  Bookmark, Palette, User, Send,
  Trash2, LayoutGrid, Grid2X2,
  RefreshCw, Copy, ImagePlus, Clock
} from 'lucide-react';

// --- Types & Declarations ---

declare var process: {
  env: {
    API_KEY?: string;
    [key: string]: any;
  }
};

type ModalType = 'settings' | 'usage' | 'price' | 'announcement' | 'styles' | 'library' | 'characters' | null;

interface AppConfig {
  baseUrl: string;
  apiKey: string;
}

interface GeneratedAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  prompt: string;
  modelName: string;
  durationText: string;
  genTimeLabel: string;
  modelId: string;
  timestamp: number;
  status?: 'queued' | 'processing' | 'completed' | 'failed' | 'loading';
  taskId?: string;
  config?: any;
}

interface ReferenceImage {
  id: string;
  data: string;
  mimeType: string;
}

interface ModelDefinition {
  id: string;
  name: string;
  cost: string;
  features: string[];
  maxImages: number;
  supportedAspectRatios: string[];
  supportedResolutions: string[];
}

interface SavedPrompt {
  id: string;
  text: string;
}

interface Character {
  id: string;
  name: string;
  tag: string; // The hidden tag, e.g., @ybm34
  avatar: string;
}

// --- Constants ---

const FIXED_BASE_URL = 'https://www.mxhdai.top';

const CHARACTERS: Record<string, Character[]> = {
  'hot': [
    { id: 'h1', name: 'ybm341', tag: '@ybm341 ', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/695632e96a640.png' },
    { id: 'h2', name: 'laoda34', tag: '@科比（真人）本人和原声音 ', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/695632d59a8a9.png' },
  ],
  'peace': [
    { id: 'p1', name: '2dhpxfq34', tag: '@2dhpxfq34', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/6955faf4ea75c.jpg' },
    { id: 'p2', name: '2dhp134', tag: '@2dhp134', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/6955faf56af01.png' },
    { id: 'p3', name: '2dhp534', tag: '@2dhp534', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/6955faf5deae9.png' },
    { id: 'p4', name: '2dhp234', tag: '@2dhp234', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/6955faf653e87.png' },
    { id: 'p5', name: '2dhp334', tag: '@2dhp334', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/6955faf6d098f.png' },
    { id: 'p6', name: '2dhp434', tag: '@2dhp434', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/6955faf757311.png' },
  ],
  'continent': [
    { id: 'c1', name: '2dsjzwl', tag: '@2dsjzwl', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/6956083f9e369.png' },
    { id: 'c2', name: '2dsjzhl1', tag: '@2dsjzhl1', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/6955fc979d091.jpg' }, // Same img url in prompt
    { id: 'c3', name: '2dsjzmxw', tag: '@2dsjzmxw', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/6955fc9baa4ce.jpg' },
    { id: 'c4', name: '2dsjzln1', tag: '@2dsjzln1', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/6955fc9b278dd.jpg' },
    { id: 'c5', name: '2dsjzwll', tag: '@2dsjzwll', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/6955fc9a9e618.jpg' },
    { id: 'c6', name: '2dsjzfy', tag: '@2dsjzfy', avatar: 'https://lsky.zhongzhuan.chat/i/2026/01/01/6955fc97ebd72.jpg' },
  ]
};

const EXTENDED_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const GPT1_RATIOS = ['1:1', '2:3', '3:2'];
const GPT15_RATIOS = ['1:1', '2:3', '3:2', '9:16', '16:9'];
const GROK_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];
const KLING_O1_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
const JIMENG_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9', '21:9'];

const MODELS: ModelDefinition[] = [
  { 
    id: 'gemini-2.5-flash-image', 
    name: 'NANO BANANA', 
    cost: 'Flash',
    features: ['fast', 'multimodal'],
    maxImages: 4,
    supportedAspectRatios: EXTENDED_RATIOS,
    supportedResolutions: ['AUTO']
  },
  { 
    id: 'gemini-3-pro-image-preview', 
    name: 'Nano Banana Pro', 
    cost: 'Pro',
    features: ['hd'],
    maxImages: 8,
    supportedAspectRatios: EXTENDED_RATIOS,
    supportedResolutions: ['1K', '2K', '4K']
  },
  {
    id: 'kling-image-o1',
    name: 'Kling Image O1',
    cost: 'Kling',
    features: ['omni', 'high-quality'],
    maxImages: 4,
    supportedAspectRatios: KLING_O1_RATIOS,
    supportedResolutions: ['1K', '2K']
  },
  {
    id: 'gpt-image-1-all',
    name: 'GPT Image 1',
    cost: 'GPT',
    features: ['stable'],
    maxImages: 4,
    supportedAspectRatios: GPT1_RATIOS,
    supportedResolutions: ['AUTO']
  },
  {
    id: 'gpt-image-1.5-all',
    name: 'GPT Image 1.5',
    cost: 'GPT-1.5',
    features: ['detail'],
    maxImages: 4,
    supportedAspectRatios: GPT15_RATIOS,
    supportedResolutions: ['AUTO']
  },
  {
    id: 'grok-4-image',
    name: 'Grok 4 Image',
    cost: 'Grok',
    features: ['creative'],
    maxImages: 4,
    supportedAspectRatios: GROK_RATIOS,
    supportedResolutions: ['AUTO']
  },
  {
    id: 'jimeng-4.5',
    name: 'Jimeng 4.5',
    cost: 'Jimeng',
    features: ['art'],
    maxImages: 8,
    supportedAspectRatios: EXTENDED_RATIOS,
    supportedResolutions: ['2K', '4K']
  }
];

const VIDEO_MODELS = [
  { 
    id: 'sora-2-all', 
    name: 'Sora 2', 
    desc: '标清视频', 
    supportedAspectRatios: ['9:16', '16:9'],
    options: [
      {s: '15', q: '标清'}, // Defaulted 15s to first
      {s: '10', q: '标清'}
    ] 
  },
  { 
    id: 'sora-2-pro-all', 
    name: 'Sora 2 Pro', 
    desc: '高清/长效', 
    supportedAspectRatios: ['9:16', '16:9'],
    options: [
      {s: '15', q: '高清'}, 
      {s: '25', q: '标清'}
    ] 
  },
  { 
    id: 'veo_3_1-fast', 
    name: 'VEO 3.1 FAST', 
    desc: '标清视频', 
    supportedAspectRatios: ['9:16', '16:9'],
    options: [
      {s: '8', q: '标清'}
    ] 
  },
  { 
    id: 'veo3.1-pro', 
    name: 'VEO 3.1 PRO', 
    desc: '高清视频', 
    supportedAspectRatios: ['9:16', '16:9'],
    options: [
      {s: '8', q: '高清'}
    ] 
  },
  {
    id: 'jimeng-video-3.0',
    name: 'Jimeng Video 3.0',
    desc: '即梦视频',
    supportedAspectRatios: JIMENG_RATIOS,
    options: [
      {s: '5', q: '标清'},
      {s: '10', q: '标清'}
    ]
  },
  {
    id: 'grok-video-3',
    name: 'Grok Video 3',
    desc: '标清视频', 
    supportedAspectRatios: ['9:16', '16:9', '2:3', '3:2', '1:1'],
    options: [
      {s: '6', q: '标清'}
    ]
  }
];

const STYLES = [
  { zh: "写实风格", en: "Realistic" },
  { zh: "3D渲染风格", en: "3D Render" },
  { zh: "扁平化风格", en: "Flat design" },
  { zh: "日系动漫风格", en: "Anime" },
  { zh: "Q版卡通风格", en: "Cartoon" },
  { zh: "传统国风风格", en: "Chinese" },
  { zh: "赛博朋克风格", en: "Cyberpunk" },
  { zh: "INS极简", en: "Minimalist" },
  { zh: "线描风格", en: "Line Art" },
  { zh: "港风风格", en: "HK Style" },
  { zh: "美式卡通风格", en: "US Cartoon" },
  { zh: "蒸汽波风格", en: "Vaporwave" },
  { zh: "水彩风格", en: "Watercolor" },
  { zh: "油画", en: "Oil Paint" },
  { zh: "像素艺术", en: "Pixel Art" },
  { zh: "故障艺术", en: "Glitch" },
  { zh: "水墨画", en: "Ink Art" },
  { zh: "马克笔", en: "Marker" },
  { zh: "彩铅", en: "Pencil" },
  { zh: "日式极简", en: "Zen" },
  { zh: "民国风", en: "Retro" },
  { zh: "超现实风格", en: "Surreal" },
  { zh: "蜡笔画", en: "Crayon" },
  { zh: "黏土", en: "Clay" },
  { zh: "折纸", en: "Origami" },
  { zh: "毛毡", en: "Felt" },
  { zh: "针织", en: "Knitted" }
];

const OPTIMIZER_MODEL = 'gpt-4o-mini';

// --- Helpers ---
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const base64ToBlob = (base64: string, mimeType: string) => {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (e) {
    console.error("base64ToBlob failed", e);
    return null;
  }
};

const urlToBlob = async (url: string) => {
    try {
        const response = await fetch(url);
        return await response.blob();
    } catch (e) {
        console.error("urlToBlob failed", e);
        return null;
    }
};

const findImageUrlInObject = (obj: any): string | null => {
  if (!obj) return null;
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    const mdMatch = trimmed.match(/!\[.*?\]\((https?:\/\/[^\s"'<>)]+)\)/i);
    if (mdMatch) return mdMatch[1];
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (!trimmed.includes(' ')) return trimmed;
    }
    if (trimmed.startsWith('data:image')) return trimmed;
    const urlMatch = trimmed.match(/(https?:\/\/[^\s"'<>]+)/i);
    if (urlMatch) return urlMatch[1];
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findImageUrlInObject(item);
      if (found) return found;
    }
  } else if (typeof obj === 'object') {
    const priorityKeys = ['url', 'b64_json', 'image', 'img', 'link', 'content', 'data', 'url'];
    for (const key of priorityKeys) {
      if (obj[key]) {
        const found = findImageUrlInObject(obj[key]);
        if (found) return found;
      }
    }
    for (const key in obj) {
      if (typeof obj[key] === 'object' || typeof obj[key] === 'string') {
        const found = findImageUrlInObject(obj[key]);
        if (found) return found;
      }
    }
  }
  return null;
};

// Strips character tags from display text
const cleanPrompt = (text: string) => {
  if (!text) return "";
  let cleaned = text;
  // Iterate through all characters to remove their tags
  Object.values(CHARACTERS).flat().forEach(char => {
    cleaned = cleaned.replace(char.tag, '').trim();
  });
  return cleaned;
};

// --- IndexedDB ---
const DB_NAME = 'viva_ai_db';
const STORE_NAME = 'assets';
const DB_VERSION = 3;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const saveAssetToDB = async (asset: GeneratedAsset) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(asset);
  } catch(e) { console.error("DB Save Error", e); }
};

const getAllAssetsFromDB = async (): Promise<GeneratedAsset[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch(e) { return []; }
};

// --- Components ---

const App = () => {
  const [mainCategory, setMainCategory] = useState<'image' | 'video'>('video');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [selectedVideoModel, setSelectedVideoModel] = useState(VIDEO_MODELS[0].id);
  const [videoOptionIdx, setVideoOptionIdx] = useState(0);
  const [videoRatio, setVideoRatio] = useState('16:9');
  const [activeModal, setActiveModal] = useState<ModalType>('announcement');
  const [previewAsset, setPreviewAsset] = useState<GeneratedAsset | null>(null);
  const [config, setConfig] = useState<AppConfig>({ baseUrl: FIXED_BASE_URL, apiKey: '' });
  const [tempConfig, setTempConfig] = useState<AppConfig>(config);
  const [prompt, setPrompt] = useState('');
  const [libraryPrompts, setLibraryPrompts] = useState<SavedPrompt[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [imageSize, setImageSize] = useState('AUTO');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generationCount, setGenerationCount] = useState(1);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [galleryTab, setGalleryTab] = useState<'all' | 'video' | 'image'>('all');
  const [galleryCols, setGalleryCols] = useState<2 | 4>(2);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [activeCharTab, setActiveCharTab] = useState<'hot'|'peace'|'continent'>('hot');

  const configRef = useRef(config);

  // Safe process.env access
  const safeEnvKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    // Dark mode class toggle
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Reset video option index when model changes
    setVideoOptionIdx(0);
    // Reset characters if switching to image mode or if video model is not supported (only sora-2 supports characters)
    if (mainCategory === 'image' || (mainCategory === 'video' && !selectedVideoModel.startsWith('sora-2'))) {
       setSelectedCharacters([]);
    }
  }, [selectedVideoModel, mainCategory]);

  useEffect(() => {
    // Model constraints logic
    if (mainCategory === 'image') {
      const model = MODELS.find(m => m.id === selectedModel);
      if (model) {
        if (!model.supportedAspectRatios.includes(aspectRatio)) setAspectRatio(model.supportedAspectRatios[0]);
        if (!model.supportedResolutions.includes(imageSize)) setImageSize(model.supportedResolutions[0]);
      }
    } else {
      const model = VIDEO_MODELS.find(m => m.id === selectedVideoModel);
      if (model) {
          if (model.supportedAspectRatios && !model.supportedAspectRatios.includes(videoRatio)) {
              setVideoRatio(model.supportedAspectRatios[0]);
          }
      }
      const max = (selectedVideoModel.startsWith('veo') || selectedVideoModel.startsWith('grok')) ? 2 : 1;
      if (referenceImages.length > max) {
        setReferenceImages(prev => prev.slice(0, max));
      }
    }
  }, [selectedModel, selectedVideoModel, mainCategory, aspectRatio, imageSize, videoRatio]);

  useEffect(() => {
    getAllAssetsFromDB().then(assets => {
        const sorted = assets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setGeneratedAssets(sorted);
        // Restart polling...
        sorted.filter(a => a.type === 'video' && (a.status === 'queued' || a.status === 'processing'))
              .forEach(v => startVideoPolling(v.taskId!, v.id, v.timestamp, v.modelId));
        sorted.filter(a => a.type === 'image' && a.modelId === 'kling-image-o1' && (a.status === 'queued' || a.status === 'processing'))
              .forEach(v => startKlingImagePolling(v.taskId!, v.id, v.timestamp));
    });
    const savedLibrary = localStorage.getItem('viva_library_prompts');
    if (savedLibrary) { try { setLibraryPrompts(JSON.parse(savedLibrary)); } catch (e) { setLibraryPrompts([]); } }
    
    // Config load
    const savedConfig = localStorage.getItem('viva_config');
    if (savedConfig) {
      try {
        const p = JSON.parse(savedConfig);
        const enforced = { ...p, baseUrl: FIXED_BASE_URL };
        setConfig(enforced);
        setTempConfig(enforced);
      } catch (e) {
        setConfig({ baseUrl: FIXED_BASE_URL, apiKey: '' });
      }
    }
  }, []);

  const saveConfig = () => {
    const normalized = { ...tempConfig, baseUrl: FIXED_BASE_URL };
    setConfig(normalized);
    setTempConfig(normalized);
    localStorage.setItem('viva_config', JSON.stringify(normalized));
    setActiveModal(null);
  };
  
  const handleDeleteLibraryPrompt = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newPrompts = libraryPrompts.filter(p => p.id !== id);
    setLibraryPrompts(newPrompts);
    localStorage.setItem('viva_library_prompts', JSON.stringify(newPrompts));
  };

  const fetchBalance = async () => {
    const key = config.apiKey || safeEnvKey;
    if (!key) { setBalance('请配置KEY'); return; }
    try {
        setBalance('查询中...');
        // Using standard billing subscription endpoint often supported by proxies
        const res = await fetch(`${config.baseUrl}/v1/dashboard/billing/subscription`, {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        const data = await res.json();
        // Common format: hard_limit_usd (total quota), has_payment_method
        // Often proxies use /v1/dashboard/billing/usage to get usage and subtract
        
        let limit = 0;
        let usage = 0;
        
        if (data.hard_limit_usd !== undefined) limit = data.hard_limit_usd;
        else if (data.quota_limit !== undefined) limit = data.quota_limit; // Some proxies
        
        // Fetch usage
        const date = new Date();
        const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString().slice(0, 10);
        
        const usageRes = await fetch(`${config.baseUrl}/v1/dashboard/billing/usage?start_date=${start}&end_date=${end}`, {
             headers: { 'Authorization': `Bearer ${key}` }
        });
        const usageData = await usageRes.json();
        if (usageData.total_usage !== undefined) usage = usageData.total_usage / 100; // usually in cents
        
        const remaining = Math.max(0, limit - usage);
        setBalance(`$${remaining.toFixed(2)} / $${limit.toFixed(2)}`);
    } catch (e) {
        setBalance('查询失败');
    }
  };

  // --- Polling Logic (Kling/Video) ---
  // Kept mostly same as before, just updating status
  const startKlingImagePolling = (taskId: string, assetId: string, startTime: number) => {
    const interval = setInterval(async () => {
        let key = configRef.current.apiKey || safeEnvKey;
        if (!key || !taskId) { clearInterval(interval); return; }
        try {
            const res = await fetch(`${configRef.current.baseUrl}/kling/v1/images/omni-image/${taskId}`, { headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' } });
            const data = await res.json();
            const taskStatus = data.data?.task_status || '';
            if (taskStatus === 'succeed') {
                 const imageUrl = data.data?.task_result?.images?.[0]?.url;
                 if (imageUrl) {
                    const diff = Math.round((Date.now() - startTime) / 1000);
                    const assetUpdates = { status: 'completed' as const, url: imageUrl, genTimeLabel: `${diff}s` };
                    setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...assetUpdates } : a));
                    const assets = await getAllAssetsFromDB();
                    const existing = assets.find(a => a.id === assetId);
                    if (existing) saveAssetToDB({ ...existing, ...assetUpdates });
                 } else {
                     setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'failed', genTimeLabel: '无图' } : a));
                 }
                 clearInterval(interval);
            } else if (taskStatus === 'failed') {
                 setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'failed', genTimeLabel: '失败' } : a));
                 clearInterval(interval);
            }
        } catch (e) { console.error(e); }
    }, 3000);
  };

  const startVideoPolling = (taskId: string, assetId: string, startTime: number, modelId: string) => {
    const interval = setInterval(async () => {
        let key = configRef.current.apiKey || safeEnvKey;
        if (!key || !taskId) { clearInterval(interval); return; }
        try {
            const isVeoGrokJimeng = modelId.startsWith('veo') || modelId.startsWith('grok') || modelId.startsWith('jimeng');
            const url = isVeoGrokJimeng ? `${configRef.current.baseUrl}/v1/video/query?id=${taskId}` : `${configRef.current.baseUrl}/v1/videos/${taskId}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' } });
            const data = await res.json();
            const rawStatus = (data.status || data.state || data.data?.status || '').toLowerCase();
            const videoUrl = data.video_url || data.url || data.uri || data.data?.url || data.data?.video_url;
            
            if (['completed', 'succeeded', 'success', 'done'].includes(rawStatus) && videoUrl) {
                const diff = Math.round((Date.now() - startTime) / 1000);
                const assetUpdates = { status: 'completed' as const, url: videoUrl, genTimeLabel: `${diff}s` };
                setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...assetUpdates } : a));
                const assets = await getAllAssetsFromDB();
                const existing = assets.find(a => a.id === assetId);
                if (existing) saveAssetToDB({ ...existing, ...assetUpdates });
                clearInterval(interval);
            } else if (['failed', 'error', 'rejected'].includes(rawStatus)) {
                setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'failed', genTimeLabel: '失败' } : a));
                clearInterval(interval);
            }
        } catch (e) { console.error(e); }
    }, 5000);
  };

  // --- Logic ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const currentModel = MODELS.find(m => m.id === selectedModel);
    const max = (mainCategory === 'image') ? (currentModel?.maxImages || 4) : ((selectedVideoModel.startsWith('veo') || selectedVideoModel.startsWith('grok')) ? 2 : 1);
    const remaining = max - referenceImages.length;
    if (remaining <= 0) { setError(`最多 ${max} 张`); return; }
    Array.from(files).slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const matches = result.match(/^data:(.+);base64,(.+)$/);
        if (matches) setReferenceImages(prev => [...prev, { id: generateUUID(), mimeType: matches[1], data: matches[2] }]);
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  const optimizePrompt = async () => {
     if (!prompt) return;
     let key = config.apiKey || safeEnvKey;
     if (!key) { setError("请先配置API Key"); return; }
     setIsOptimizing(true);
     let sys = `你是一位专业的AI绘画提示词工程师。请将用户的输入（可能是简短的中文或英文）改写成一段高质量、细节丰富的中文绘画提示词。扩展核心元素：主体、风格、光影、构图和氛围。只输出优化后的提示词文本，不要输出其他任何解释。`;
     if (mainCategory === 'video') sys = `你是一位专业的AI视频提示词专家。请根据用户的输入，生成一段完整、连贯、高质量的中文视频生成提示词。`;
     try {
        const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({ model: OPTIMIZER_MODEL, messages: [{ role: "system", content: sys }, { role: "user", content: prompt }] })
        });
        const data = await res.json();
        const optimized = data.choices?.[0]?.message?.content?.trim();
        if (optimized) setPrompt(optimized);
     } catch (e) { setError("AI优化失败"); } finally { setIsOptimizing(false); }
  };

  const handleRegenerate = (asset: GeneratedAsset) => {
    setPrompt(asset.prompt);
    // Determine category
    const isVideo = VIDEO_MODELS.some(m => m.id === asset.modelId);
    setMainCategory(isVideo ? 'video' : 'image');
    if (isVideo) {
        setSelectedVideoModel(asset.modelId);
        if (asset.config) {
             setVideoRatio(asset.config.videoRatio || '16:9');
             setVideoOptionIdx(asset.config.videoOptionIdx || 0);
        }
    } else {
        setSelectedModel(asset.modelId);
        if (asset.config) {
            setAspectRatio(asset.config.aspectRatio || '1:1');
            setImageSize(asset.config.imageSize || 'AUTO');
        }
    }
    // Scroll to bottom to show inputs
    setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };
  
  const handleUseAsReference = async (asset: GeneratedAsset) => {
    if (asset.type !== 'image') return;
    try {
        const response = await fetch(asset.url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = (reader.result as string).split(',')[1];
            setReferenceImages(prev => [...prev, {
                id: generateUUID(),
                data: base64data,
                mimeType: blob.type || 'image/png'
            }]);
        };
        reader.readAsDataURL(blob);
        setShowSaveSuccess(true); 
        setTimeout(()=>setShowSaveSuccess(false),2000);
    } catch (e) {
        setError('无法加载图片作为参考');
    }
  };

  const executeGeneration = async () => {
      if (!prompt) { setError("请输入提示词"); return; }
      let finalPrompt = prompt;
      let key = config.apiKey || safeEnvKey;
      
      // Inject characters if Sora model selected
      if (mainCategory === 'video' && selectedVideoModel.startsWith('sora-2') && selectedCharacters.length > 0) {
          const tags = selectedCharacters.join(' ');
          finalPrompt = `${tags} ${prompt}`;
      }

      if (mainCategory === 'video') {
         // Video Generation Logic
         const count = generationCount;
         const startTime = Date.now();
         const tModelId = selectedVideoModel;
         const placeholders: GeneratedAsset[] = [];

         for (let i = 0; i < count; i++) {
            placeholders.push({
                id: generateUUID(), url: '', type: 'video', prompt: finalPrompt, // Store full prompt including tags
                modelId: tModelId, modelName: VIDEO_MODELS.find(m => m.id === tModelId)!.name,
                durationText: `${VIDEO_MODELS.find(m => m.id === tModelId)!.options[videoOptionIdx].s}s`,
                genTimeLabel: '生成中...', timestamp: startTime, status: 'loading',
                config: { modelId: tModelId, videoRatio, videoOptionIdx, prompt: finalPrompt }
            });
         }
         setGeneratedAssets(prev => [...placeholders, ...prev]);

         try {
             const createOne = async (pId: string) => {
                 const isVeoGrokJimeng = tModelId.startsWith('veo') || tModelId.startsWith('grok') || tModelId.startsWith('jimeng');
                 let response;
                 if (isVeoGrokJimeng) {
                     const payload: any = { model: tModelId, prompt: finalPrompt, images: referenceImages.map(img => img.data.startsWith('http') ? img.data : `data:${img.mimeType};base64,${img.data}`), aspect_ratio: videoRatio };
                     if (tModelId.startsWith('veo')) { payload.enhance_prompt = true; payload.enable_upsample = true; }
                     if (tModelId.startsWith('grok')) payload.size = '720P';
                     if (tModelId.startsWith('jimeng')) payload.duration = parseInt(VIDEO_MODELS.find(m => m.id === tModelId)!.options[videoOptionIdx].s);
                     response = await fetch(`${config.baseUrl}/v1/video/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify(payload) });
                 } else {
                     const formData = new FormData();
                     formData.append('model', tModelId);
                     formData.append('prompt', finalPrompt);
                     formData.append('seconds', VIDEO_MODELS.find(m => m.id === tModelId)!.options[videoOptionIdx].s);
                     formData.append('size', videoRatio.replace(':', 'x'));
                     if (referenceImages.length > 0) {
                        const blob = await (referenceImages[0].data.startsWith('http') ? urlToBlob(referenceImages[0].data) : base64ToBlob(referenceImages[0].data, referenceImages[0].mimeType));
                        if(blob) formData.append('input_reference', blob, 'reference.png');
                     }
                     response = await fetch(`${config.baseUrl}/v1/videos`, { method: 'POST', headers: { 'Authorization': `Bearer ${key}` }, body: formData });
                 }
                 const data = await response.json();
                 if (!response.ok) throw new Error(data.error?.message || "Error");
                 const tid = data.id || data.data?.id || data.task_id;
                 const updated = { ...placeholders.find(x => x.id === pId), status: 'queued', taskId: tid } as GeneratedAsset;
                 setGeneratedAssets(prev => prev.map(a => a.id === pId ? updated : a));
                 saveAssetToDB(updated);
                 startVideoPolling(tid, pId, startTime, tModelId);
             }
             placeholders.forEach(p => createOne(p.id));
         } catch(e: any) { setError(e.message); setGeneratedAssets(prev => prev.filter(a => !placeholders.find(p => p.id === a.id))); }

      } else {
          // Image Generation Logic (simplified from original for brevity, logic holds)
          const startTime = Date.now();
          const count = generationCount;
          const placeholders: GeneratedAsset[] = [];
          for(let i=0; i<count; i++) {
             placeholders.push({
                 id: generateUUID(), url: '', type: 'image', prompt: finalPrompt,
                 modelId: selectedModel, modelName: MODELS.find(m=>m.id===selectedModel)?.name||selectedModel,
                 durationText: imageSize, genTimeLabel: '生成中...', timestamp: startTime, status: 'loading',
                 config: { modelId: selectedModel, aspectRatio, imageSize, prompt: finalPrompt }
             });
          }
          setGeneratedAssets(prev => [...placeholders, ...prev]);

          if (selectedModel === 'kling-image-o1') {
             // Async logic
             const createOne = async (pId: string) => {
                 try {
                     const payload = { model_name: "kling-image-o1", prompt: finalPrompt, n: 1, aspect_ratio: aspectRatio, resolution: imageSize.toLowerCase(), image_list: referenceImages.map(img => ({ image: img.data.startsWith('http') ? img.data : `data:${img.mimeType};base64,${img.data}` })) };
                     const res = await fetch(`${config.baseUrl}/kling/v1/images/omni-image`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`}, body: JSON.stringify(payload) });
                     const data = await res.json();
                     if (data.code !== 0) throw new Error(data.message);
                     const updated = { ...placeholders.find(x => x.id === pId), status: 'queued', taskId: data.data?.task_id } as GeneratedAsset;
                     setGeneratedAssets(prev => prev.map(a => a.id === pId ? updated : a));
                     saveAssetToDB(updated);
                     startKlingImagePolling(data.data?.task_id, pId, startTime);
                 } catch(e:any) { 
                    setGeneratedAssets(prev => prev.map(a => a.id === pId ? { ...a, status: 'failed', genTimeLabel: 'Error' } : a));
                 }
             }
             placeholders.forEach(p => createOne(p.id));
          } else {
             // Sync logic (Gemini/GPT/etc)
             const createOne = async (pId: string) => {
                 let url = '';
                 try {
                     if (selectedModel.startsWith('gemini')) {
                         const parts: any[] = [{ text: finalPrompt }];
                         referenceImages.forEach(img => parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } }));
                         const res = await fetch(`${config.baseUrl}/v1beta/models/${selectedModel}:generateContent`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`}, body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio, imageSize: imageSize==='AUTO'?undefined:imageSize } } }) });
                         const data = await res.json();
                         const part = data.candidates?.[0]?.content?.parts?.find((p:any) => p.inlineData);
                         url = part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : '';
                     } else {
                         // OpenAI compatible
                         const content: any[] = [{ type: "text", text: `${finalPrompt} --ar ${aspectRatio}` }];
                         referenceImages.forEach(img => content.push({ type: "image_url", image_url: { url: `data:${img.mimeType};base64,${img.data}` } }));
                         const res = await fetch(`${config.baseUrl}/v1/chat/completions`, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`}, body: JSON.stringify({ model: selectedModel, messages: [{role:"user", content}], stream: false }) });
                         const data = await res.json();
                         url = findImageUrlInObject(data) || '';
                     }
                     if(url) {
                        const diff = Math.round((Date.now() - startTime)/1000);
                        const updated: GeneratedAsset = { ...placeholders.find(x => x.id === pId)!, url, genTimeLabel: `${diff}s`, status: 'completed' };
                        setGeneratedAssets(prev => prev.map(a => a.id === pId ? updated : a));
                        saveAssetToDB(updated);
                     } else { throw new Error("No URL"); }
                 } catch(e) {
                    setGeneratedAssets(prev => prev.map(a => a.id === pId ? { ...a, status: 'failed', genTimeLabel: 'Fail' } : a));
                 }
             }
             placeholders.forEach(p => createOne(p.id));
          }
      }
      setShowSettings(false);
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(cleanPrompt(text));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCharacter = (tag: string) => {
    setSelectedCharacters(prev => {
        if (prev.includes(tag)) return prev.filter(t => t !== tag);
        if (prev.length >= 3) return prev;
        return [...prev, tag];
    });
  };

  // --- Render Sections ---

  const renderHeader = () => (
    <header className="fixed top-0 left-0 right-0 h-16 glass z-50 px-4 md:px-6 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-4">
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {darkMode ? <Moon className="w-5 h-5 text-brand-teal" /> : <Sun className="w-5 h-5 text-brand-teal" />}
        </button>
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent">MXAi</span>
      </div>

      <div className="flex items-center gap-3">
         <button onClick={fetchBalance} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium hover:ring-2 ring-brand-teal transition-all">
            <Wallet className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-700 dark:text-slate-300">{balance || '余额'}</span>
         </button>
         <button onClick={() => setActiveModal('price')} className="text-xs font-medium text-slate-500 hover:text-brand-teal transition-colors">价格</button>
         <button onClick={() => setActiveModal('usage')} className="text-xs font-medium text-slate-500 hover:text-brand-teal transition-colors">流程</button>
         <button onClick={() => setActiveModal('settings')} className="p-2 rounded-full bg-slate-900 text-white hover:bg-slate-700 transition-colors">
            <LogIn className="w-4 h-4" />
         </button>
      </div>
    </header>
  );

  const renderHero = () => {
    if (generatedAssets.length > 0) return null;
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 mt-16 pb-40">
            <div className="magic-ring mb-8"></div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">导演！我时刻等待您吩咐</h1>
            <p className="text-sm text-slate-400">请在下方↓输入提示词开始创作</p>
        </div>
    );
  };

  const renderGallery = () => {
    if (generatedAssets.length === 0) return null;
    const filtered = generatedAssets.filter(a => galleryTab === 'all' || a.type === galleryTab);
    
    return (
        <div className="flex-1 pb-48 w-full">
            <div className="h-16"></div> {/* Spacer for fixed header */}
            
            {/* Sticky Tabs Bar - Fixed z-index and position handling */}
            <div className="sticky top-16 z-40 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-3 flex items-center justify-between mb-6 shadow-sm overflow-hidden">
                 <div className="flex items-center gap-4 max-w-7xl mx-auto w-full justify-center md:justify-start">
                     {/* Layout Toggle */}
                     <button onClick={() => setGalleryCols(prev => prev === 2 ? 4 : 2)} className="p-1.5 rounded-md bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-brand-teal transition-colors flex-shrink-0">
                        {galleryCols === 2 ? <Grid2X2 className="w-4 h-4"/> : <LayoutGrid className="w-4 h-4"/>}
                     </button>
                     
                     <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-600 flex-shrink-0"></div>

                     {/* Tabs */}
                     <div className="flex gap-6">
                        {['all', 'video', 'image'].map(t => (
                            <button key={t} onClick={() => setGalleryTab(t as any)} 
                                    className={`text-sm font-medium transition-colors relative whitespace-nowrap ${galleryTab === t ? 'text-brand-teal font-bold' : 'text-slate-500 hover:text-slate-700'}`}>
                                {t === 'all' ? '全部' : t === 'video' ? '视频' : '图片'}
                                {galleryTab === t && <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-brand-teal rounded-full" />}
                            </button>
                        ))}
                     </div>
                 </div>
            </div>

            <div className={`px-4 md:px-8 max-w-7xl mx-auto grid gap-4 ${galleryCols === 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
                {filtered.map(asset => (
                    <div key={asset.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-slate-100 dark:border-slate-700 flex flex-col">
                        <div onClick={() => setPreviewAsset(asset)} className="aspect-square relative cursor-pointer bg-slate-50 dark:bg-slate-900">
                            {asset.status === 'loading' || asset.status === 'queued' || asset.status === 'processing' ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-brand-teal mb-2" />
                                    <span className="text-xs text-slate-400">{asset.status === 'queued' ? '排队中...' : '生成中...'}</span>
                                </div>
                            ) : asset.status === 'failed' ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400">
                                    <AlertCircle className="w-8 h-8 mb-2" />
                                    <span className="text-xs">{asset.genTimeLabel}</span>
                                </div>
                            ) : asset.type === 'video' ? (
                                <video src={asset.url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                            ) : (
                                <img src={asset.url} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur px-2 py-0.5 rounded text-[10px] text-white uppercase font-bold">
                                {asset.type}
                            </div>
                        </div>
                        
                        <div className="p-3 flex flex-col gap-2 flex-1">
                            {/* Card Header: Model & Time */}
                            <div className="flex justify-between items-center text-xs">
                                <div className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[60%] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                    {asset.modelName}
                                </div>
                                <div className="flex items-center gap-1 text-slate-400">
                                    <Clock className="w-3 h-3"/>
                                    <span>{asset.genTimeLabel}</span>
                                </div>
                            </div>

                            {/* Prompt Snippet (Optional but good for context) */}
                            <p className="text-[10px] text-slate-500 line-clamp-2 h-8" title={cleanPrompt(asset.prompt)}>
                                {cleanPrompt(asset.prompt)}
                            </p>

                            {/* Card Footer Actions - Only show in 2-column mode */}
                            {galleryCols === 2 && (
                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
                                    <button onClick={() => handleRegenerate(asset)} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-brand-teal transition-colors" title="重新生成">
                                        <RefreshCw className="w-3 h-3"/> 重新生成
                                    </button>
                                    
                                    {asset.type === 'image' && (
                                        <button onClick={() => handleUseAsReference(asset)} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-brand-teal transition-colors" title="作为参考图">
                                            <ImagePlus className="w-3 h-3"/> 参考
                                        </button>
                                    )}

                                    <button onClick={() => handleCopyPrompt(asset.prompt, asset.id)} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-brand-teal transition-colors" title="复制提示词">
                                        {copiedId === asset.id ? <Check className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                                        复制
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const renderBottomPanel = () => (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 transition-all duration-300 pb-safe">
        {/* Settings Popover */}
        {showSettings && (
            <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-xl rounded-t-2xl animate-in slide-in-from-bottom-5">
                <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">模式 / Mode</label>
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <button onClick={() => setMainCategory('image')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${mainCategory === 'image' ? 'bg-white dark:bg-slate-700 shadow text-brand-teal' : 'text-slate-500'}`}>图片</button>
                            <button onClick={() => setMainCategory('video')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${mainCategory === 'video' ? 'bg-white dark:bg-slate-700 shadow text-brand-teal' : 'text-slate-500'}`}>视频</button>
                        </div>
                    </div>
                    <div>
                         <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">模型 / Model</label>
                         <select value={mainCategory === 'image' ? selectedModel : selectedVideoModel} onChange={(e) => mainCategory==='image' ? setSelectedModel(e.target.value) : setSelectedVideoModel(e.target.value)} 
                                 className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none border border-transparent focus:border-brand-teal">
                            {(mainCategory==='image' ? MODELS : VIDEO_MODELS).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                         </select>
                    </div>
                    <div>
                         <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">参数 / Params</label>
                         <div className="flex gap-2">
                            {mainCategory === 'image' ? (
                                <>
                                  <select value={aspectRatio} onChange={(e)=>setAspectRatio(e.target.value)} className="flex-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs outline-none">{MODELS.find(m=>m.id===selectedModel)?.supportedAspectRatios.map(r=><option key={r} value={r}>{r}</option>)}</select>
                                  <select value={imageSize} onChange={(e)=>setImageSize(e.target.value)} className="flex-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs outline-none">{MODELS.find(m=>m.id===selectedModel)?.supportedResolutions.map(r=><option key={r} value={r}>{r}</option>)}</select>
                                </>
                            ) : (
                                <>
                                  <select value={videoRatio} onChange={(e)=>setVideoRatio(e.target.value)} className="flex-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs outline-none">{VIDEO_MODELS.find(m=>m.id===selectedVideoModel)?.supportedAspectRatios.map(r=><option key={r} value={r}>{r}</option>)}</select>
                                  <select value={videoOptionIdx} onChange={(e)=>setVideoOptionIdx(parseInt(e.target.value))} className="flex-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs outline-none">{VIDEO_MODELS.find(m=>m.id===selectedVideoModel)?.options.map((o,i)=><option key={i} value={i}>{o.s}s</option>)}</select>
                                </>
                            )}
                         </div>
                    </div>
                    <div className="md:col-span-3">
                         <label className="text-xs font-bold text-slate-500 mb-2 block uppercase flex justify-between">
                            <span>生成数量: {generationCount}</span>
                         </label>
                         <input type="range" min="1" max="10" value={generationCount} onChange={(e)=>setGenerationCount(parseInt(e.target.value))} className="w-full accent-brand-teal" />
                    </div>
                </div>
            </div>
        )}

        <div className="max-w-3xl mx-auto p-2">
            {/* Selected Items Preview (Characters + Images) ABOVE Quick Actions */}
            {((referenceImages.length > 0) || (selectedCharacters.length > 0 && mainCategory === 'video' && selectedVideoModel.startsWith('sora-2'))) && (
                <div className="flex gap-2 mb-2 px-2 overflow-x-auto no-scrollbar py-1">
                    {/* Selected Characters */}
                    {mainCategory === 'video' && selectedVideoModel.startsWith('sora-2') && selectedCharacters.map(tag => {
                         const char = Object.values(CHARACTERS).flat().find(c => c.tag === tag);
                         if(!char) return null;
                         return (
                            <div key={tag} className="relative w-10 h-10 rounded-full ring-2 ring-brand-teal p-0.5 flex-shrink-0">
                                <img src={char.avatar} className="w-full h-full rounded-full object-cover"/>
                                <button onClick={() => toggleCharacter(tag)} className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full"><X className="w-2 h-2"/></button>
                            </div>
                         );
                    })}
                    {/* Reference Images */}
                    {referenceImages.map(img => (
                        <div key={img.id} className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                            <img src={img.data.startsWith('http')?img.data:`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover" />
                            <button onClick={() => setReferenceImages(prev=>prev.filter(i=>i.id!==img.id))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"><X className="w-2 h-2"/></button>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Actions Row */}
            <div className="flex items-center gap-4 mb-3 px-2 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveModal('library')} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-teal whitespace-nowrap">
                    <Bookmark className="w-4 h-4" /> 词库
                </button>
                {mainCategory === 'video' && selectedVideoModel.startsWith('sora-2') && (
                    <button onClick={() => setActiveModal('characters')} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-teal whitespace-nowrap">
                        <User className="w-4 h-4" /> 角色库 ({selectedCharacters.length})
                    </button>
                )}
                <button onClick={() => { if(prompt) { const p={id:generateUUID(), text:prompt}; setLibraryPrompts([p,...libraryPrompts]); localStorage.setItem('viva_library_prompts', JSON.stringify([p,...libraryPrompts])); setShowSaveSuccess(true); setTimeout(()=>setShowSaveSuccess(false),2000); }}} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-teal whitespace-nowrap">
                    <Check className="w-4 h-4" /> 保存提示词
                </button>
                <button onClick={() => setActiveModal('styles')} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-teal whitespace-nowrap">
                    <Palette className="w-4 h-4" /> 风格
                </button>
                <button onClick={optimizePrompt} disabled={isOptimizing} className="flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 whitespace-nowrap ml-auto">
                    {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4" />} AI优化
                </button>
            </div>

            {/* Input Bar */}
            <div className="flex items-end gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all focus-within:shadow-md focus-within:border-brand-teal">
                <label className="p-3 text-slate-400 hover:text-brand-teal cursor-pointer transition-colors">
                    <ImageIcon className="w-6 h-6" />
                    <input type="file" multiple className="hidden" onChange={handleImageUpload} />
                </label>
                
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="请输入..."
                    className="flex-1 bg-transparent border-none outline-none resize-none py-3 overflow-y-auto text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 leading-relaxed"
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }}
                />

                <div className="flex items-center gap-2 pb-1">
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-400 hover:text-brand-teal transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        {showSettings ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </button>
                    <button onClick={executeGeneration} className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center text-white shadow-lg hover:shadow-teal-500/30 hover:scale-105 transition-all">
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                </div>
            </div>
            
            {showSaveSuccess && <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full shadow-lg">已保存</div>}
            {error && <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow-lg">{error}</div>}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {renderHeader()}
      {renderHero()}
      {renderGallery()}
      {renderBottomPanel()}

      {/* --- Modals --- */}
      
      {/* Settings Modal (Key) */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                <h3 className="text-lg font-bold mb-4">登录</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">API 秘钥</label>
                        <input type="password" value={tempConfig.apiKey} onChange={e => setTempConfig({...tempConfig, apiKey:e.target.value})} className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border-none outline-none focus:ring-2 ring-brand-teal" placeholder="sk-..." />
                    </div>
                    <button onClick={saveConfig} className="w-full py-3 rounded-xl bg-brand-teal text-white font-bold hover:bg-teal-500 transition-colors">保存</button>
                </div>
                <button onClick={()=>setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
        </div>
      )}

      {/* Character Library Modal */}
      {activeModal === 'characters' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">角色库 (已选 {selectedCharacters.length}/3)</h3>
                    <button onClick={()=>setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
                </div>
                <div className="flex gap-4 border-b border-slate-200 mb-4">
                    {[
                        {id:'hot', l:'热门'},
                        {id:'peace', l:'和平二创'},
                        {id:'continent', l:'洲二创'}
                    ].map(tab => (
                        <button key={tab.id} onClick={()=>setActiveCharTab(tab.id as any)} 
                                className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeCharTab===tab.id ? 'border-brand-teal text-brand-teal' : 'border-transparent text-slate-400'}`}>
                            {tab.l}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-4 p-2">
                    {CHARACTERS[activeCharTab].map(char => (
                        <div key={char.id} onClick={()=>toggleCharacter(char.tag)} 
                             className={`cursor-pointer rounded-full overflow-hidden aspect-square relative border-2 transition-all group ${selectedCharacters.includes(char.tag) ? 'border-brand-teal ring-2 ring-brand-teal/30 scale-105' : 'border-transparent hover:border-slate-200'}`}>
                             <img src={char.avatar} className="w-full h-full object-cover" />
                             {selectedCharacters.includes(char.tag) && <div className="absolute inset-0 bg-brand-teal/30 flex items-center justify-center"><Check className="text-white w-8 h-8"/></div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Asset Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-4" onClick={() => setPreviewAsset(null)}>
            <div className="w-full h-full flex flex-col items-center justify-center relative" onClick={e=>e.stopPropagation()}>
                <div className="flex-1 w-full flex items-center justify-center overflow-hidden mb-6">
                    {previewAsset.type === 'video' ? (
                        <video src={previewAsset.url} controls autoPlay loop className="max-w-full max-h-full rounded-lg shadow-2xl" />
                    ) : (
                        <img src={previewAsset.url} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                    )}
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 flex gap-4">
                    <a href={previewAsset.url} download={`mxai-${previewAsset.id}`} className="flex items-center gap-2 px-6 py-3 bg-brand-teal text-white rounded-xl font-bold hover:bg-teal-500 transition-all">
                        <Download className="w-5 h-5"/> 下载
                    </a>
                    <button onClick={() => handleCopyPrompt(previewAsset.prompt, previewAsset.id)} className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-all">
                        {copiedId === previewAsset.id ? <Check className="w-5 h-5 text-green-500"/> : <Check className="w-5 h-5 opacity-0"/>}
                        复制提示词
                    </button>
                </div>
                <button onClick={() => setPreviewAsset(null)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-10 h-10"/></button>
            </div>
        </div>
      )}

      {/* Announcement Modal */}
      {activeModal === 'announcement' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="bg-brand-teal p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">最新公告</h3>
                    <button onClick={()=>setActiveModal(null)} className="text-white/80 hover:text-white"><X className="w-6 h-6"/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5"/> 首次使用请点击右上角登录！！！
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl space-y-2">
                         <div className="flex items-center gap-2"><span className="bg-brand-teal text-white text-[10px] px-1.5 py-0.5 rounded">NEW</span> <span className="font-bold text-sm">角色库  上线</span></div>
                         <p className="text-xs text-slate-500 ml-9">一致性Max</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl space-y-2">
                         <div className="flex items-center gap-2"><span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">NEW</span> <span className="font-bold text-sm">图片模型 Kling O1 上线</span></div>
                         <p className="text-xs text-slate-500 ml-9">支持1K/2K分辨率。</p>
                    </div>
                    <button onClick={()=>setActiveModal(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">我知道了</button>
                </div>
            </div>
        </div>
      )}
      
      {/* Price Modal */}
      {activeModal === 'price' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative max-h-[80vh] overflow-hidden flex flex-col">
                 <h3 className="text-lg font-bold mb-4">价格说明</h3>
                 <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                    {[
                        {t:'ai优化', i:[{n:'gemini-3-flash-preview', p:'0.002'}, ]},
                        {t:'图片模型', i:[{n:'Nano Banana', p:'0.09'}, {n:'Nano Banana Pro', p:'0.22-0.40'}, {n:'Kling O1', p:'0.24'}, {n:'Grok 4 Image', p:'0.06'}]},
                        {t:'视频模型', i:[{n:'Sora 2', p:'0.12'}, {n:'Sora 2 Pro', p:'2.52'}, {n:'VEO 3.1 FAST', p:'0.11'}, {n:'Grok Video 3', p:'0.14'}]}
                    ].map(cat => (
                        <div key={cat.t}>
                            <h4 className="font-bold text-brand-teal mb-2">{cat.t}</h4>
                            <div className="space-y-2">
                                {cat.i.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-1">
                                        <span>{item.n}</span>
                                        <span className="font-mono text-slate-500">{item.p}元/次</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                 </div>
                 <button onClick={()=>setActiveModal(null)} className="absolute top-4 right-4"><X className="w-5 h-5"/></button>
            </div>
          </div>
      )}

      {/* Library/Styles simplified placeholders for brevity, they open respective modals */}
      {(activeModal === 'library' || activeModal === 'styles') && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{activeModal==='library'?'提示词库':'风格选择'}</h3>
                    <button onClick={()=>setActiveModal(null)}><X className="w-6 h-6"/></button>
                </div>
                {activeModal === 'library' ? (
                    <div className="space-y-2">
                        {libraryPrompts.map((p,i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer group">
                                <div onClick={()=>{setPrompt(p.text);setActiveModal(null)}} className="text-sm line-clamp-2 flex-1">{p.text}</div>
                                <button onClick={(e)=>handleDeleteLibraryPrompt(e, p.id)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        ))}
                        {libraryPrompts.length===0 && <div className="text-center text-slate-400 py-10">暂无收藏</div>}
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-2">
                        {STYLES.map(s => (
                            <button key={s.en} onClick={()=>{setPrompt(prev=>prev?prev+', '+s.zh:s.zh); setActiveModal(null)}} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-xs hover:bg-brand-teal hover:text-white transition-colors">
                                {s.zh}
                            </button>
                        ))}
                    </div>
                )}
             </div>
          </div>
      )}

      {/* Usage Flow */}
       {activeModal === 'usage' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
                <h3 className="text-lg font-bold mb-6">使用流程</h3>
                <div className="space-y-6 relative pl-4 border-l-2 border-slate-200 ml-2">
                    {[
                        {t:'注册与令牌', d: <>前往主站 <a href="www.mxhdai.top" target="_blank" className="text-blue-600 font-bold underline italic">www.mxhdai.top</a> 获取key</>},
                        {t:'配置使用', d:'点击右上角登录，输入Key'},
                        {t:'联系24客服', d: <> <a href="https://qm.qq.com/q/jg2RcviAca" target="_blank" className="text-blue-600 font-bold underline italic">QQ： 1401906087</a> <a href="https://lsky.zhongzhuan.chat/i/2025/12/31/6954c34156318.jpg" target="_blank" className="text-blue-600 font-bold underline italic">vx： LPS3434</a> 获取key</>}
                    ].map((step, i) => (
                        <div key={i} className="relative">
                            <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-brand-teal border-2 border-white dark:border-slate-800"></div>
                            <h4 className="font-bold text-sm mb-1">{step.t}</h4>
                            <p className="text-xs text-slate-500">{step.d}</p>
                        </div>
                    ))}
                </div>
                <button onClick={()=>setActiveModal(null)} className="absolute top-4 right-4"><X className="w-5 h-5"/></button>
             </div>
        </div>
       )}

    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);