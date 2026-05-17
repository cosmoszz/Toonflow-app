/**
 * Toonflow AI供应商模板
 * @version 2.0
 */

// ============================================================
// 类型定义
// ============================================================

type VideoMode =
  | "singleImage"
  | "startEndRequired"
  | "endFrameOptional"
  | "startFrameOptional"
  | "text"
  | (`videoReference:${number}` | `imageReference:${number}` | `audioReference:${number}`)[];

interface TextModel {
  name: string;
  modelName: string;
  type: "text";
  think: boolean;
}

interface ImageModel {
  name: string;
  modelName: string;
  type: "image";
  mode: ("text" | "singleImage" | "multiReference")[];
  associationSkills?: string;
}

interface VideoModel {
  name: string;
  modelName: string;
  type: "video";
  mode: VideoMode[];
  associationSkills?: string;
  audio: "optional" | false | true;
  durationResolutionMap: { duration: number[]; resolution: string[] }[];
}

interface TTSModel {
  name: string;
  modelName: string;
  type: "tts";
  voices: { title: string; voice: string }[];
}

interface VendorConfig {
  id: string;
  version: string;
  name: string;
  author: string;
  description?: string;
  icon?: string;
  inputs: { key: string; label: string; type: "text" | "password" | "url"; required: boolean; placeholder?: string }[];
  inputValues: Record<string, string>;
  models: (TextModel | ImageModel | VideoModel | TTSModel)[];
}

type ReferenceList =
  | { type: "image"; sourceType: "base64"; base64: string }
  | { type: "audio"; sourceType: "base64"; base64: string }
  | { type: "video"; sourceType: "base64"; base64: string };

interface ImageConfig {
  prompt: string;
  referenceList?: Extract<ReferenceList, { type: "image" }>[];
  size: "1K" | "2K" | "4K";
  aspectRatio: `${number}:${number}`;
}

interface VideoConfig {
  duration: number;
  resolution: string;
  aspectRatio: "16:9" | "9:16";
  prompt: string;
  referenceList?: ReferenceList[];
  audio?: boolean;
  mode: VideoMode[];
}

interface TTSConfig {
  text: string;
  voice: string;
  speechRate: number;
  pitchRate: number;
  volume: number;
  referenceList?: Extract<ReferenceList, { type: "audio" }>[];
}

interface PollResult {
  completed: boolean;
  data?: string;
  error?: string;
}

// ============================================================
// 全局声明
// ============================================================

declare const axios: any;
declare const logger: (msg: string) => void;
declare const jsonwebtoken: any;
declare const zipImage: (base64: string, size: number) => Promise<string>;
declare const zipImageResolution: (base64: string, w: number, h: number) => Promise<string>;
declare const mergeImages: (base64Arr: string[], maxSize?: string) => Promise<string>;
declare const urlToBase64: (url: string) => Promise<string>;
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>;
declare const createOpenAI: any;
declare const createDeepSeek: any;
declare const createZhipu: any;
declare const createQwen: any;
declare const createAnthropic: any;
declare const createOpenAICompatible: any;
declare const createXai: any;
declare const createMinimax: any;
declare const createGoogleGenerativeAI: any;
declare const exports: {
  vendor: VendorConfig;
  textRequest: (m: TextModel, t: boolean, tl: 0 | 1 | 2 | 3) => any;
  imageRequest: (c: ImageConfig, m: ImageModel) => Promise<string>;
  videoRequest: (c: VideoConfig, m: VideoModel) => Promise<string>;
  ttsRequest: (c: TTSConfig, m: TTSModel) => Promise<string>;
  checkForUpdates?: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>;
  updateVendor?: () => Promise<string>;
};

// ============================================================
// 供应商配置
// ============================================================

const vendor: VendorConfig = {
  id: "bull",
  version: "2.0",
  author: "Toonflow",
  name: "zenmux",
  description: "## Zenmux 多模态接口\n- 文本/视频使用标准 OpenAI 兼容格式。\n- 图片生成使用 Vertex AI 兼容端点。",
  inputs: [
    { key: "apiKey", label: "API Key", type: "password", required: true },
    {
      key: "baseUrl",
      label: "BaseUrl (文本/视频)",
      type: "url",
      required: true,
      placeholder: "示例：https://api.openai.com/v1",
    },
    {
      key: "imageBaseUrl",
      label: "图片生成 BaseUrl (Vertex AI)",
      type: "url",
      required: false,
      placeholder: "示例：https://zenmux.ai/api/vertex-ai/v1",
    },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: "https://zenmux.ai/api/v1",
    imageBaseUrl: "https://zenmux.ai/api/vertex-ai/v1",
  },
  models: [
    { name: "Doubao-Seed-2.0-Pro", modelName: "bytedance/doubao-seed-2.0-pro", type: "text", think: true },
    { name: "Glm-5.1", modelName: "z-ai/glm-5.1", type: "text", think: true },
    { name: "Deepseek/deepseek-v4-pro", modelName: "deepseek/deepseek-v4-pro", type: "text", think: true },
    { name: "Deepseek/deepseek-v4-flash", modelName: "deepseek/deepseek-v4-flash", type: "text", think: true },
    {
      name: "Seedream-5.0-Lite",
      modelName: "bytedance/doubao-seedream-5.0-lite",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Qwen-Image-2.0-Pro",
      modelName: "qwen/qwen-image-2.0-pro",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "GPT-Image-2",
      modelName: "openai/gpt-image-2",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Seedance-2.0(音画同生)",
      modelName: "bytedance/doubao-seedance-2.0",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
    {
      name: "Seedance-1.5-Pro(音画同生)",
      modelName: "bytedance/doubao-seedance-1.5-pro",
      type: "video",
      mode: ["text", "startFrameOptional"],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12], resolution: ["480p", "720p", "1080p"] }],
    },
  ],
};

// ============================================================
// 辅助工具
// ============================================================

const getHeaders = () => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "")}`,
  };
};

const getBaseUrl = () => vendor.inputValues.baseUrl.replace(/\/+$/, "");

/**
 * 从带 data URI 头的 base64 字符串中提取纯 base64 部分
 * 输入："data:image/png;base64,iVBOR..."
 * 输出："iVBOR..."
 */
const extractPureBase64 = (dataUrl: string): string => {
  if (!dataUrl || typeof dataUrl !== "string") return "";
  const parts = dataUrl.split(",");
  if (parts.length === 2 && parts[0].includes("base64")) {
    return parts[1];
  }
  return dataUrl;
};

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");

  // reasoning_effort 有效值: low, medium, high, max, xhigh（不支持 minimal）
  const effortMap: Record<number, string> = {
    0: "low",
    1: "medium",
    2: "high",
    3: "xhigh",
  };

  return createOpenAICompatible({
    name: "volcengine",
    baseURL: getBaseUrl(),
    apiKey,
    fetch: async (url: string, options?: RequestInit) => {
      const rawBody = JSON.parse((options?.body as string) ?? "{}");
      const modifiedBody = {
        ...rawBody,
        thinking: { type: "enabled" },
        reasoning_effort: effortMap[thinkLevel],
      };
      return await fetch(url, {
        ...options,
        body: JSON.stringify(modifiedBody),
      });
    },
  }).chatModel(model.modelName);
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");

  const imageBaseUrl = (vendor.inputValues.imageBaseUrl || "").replace(/\/+$/, "") || getBaseUrl();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "")}`,
  };

  const url = `${imageBaseUrl}/models/${model.modelName}:predict`;
  const instance: any = { prompt: config.prompt || "" };

  // 参考图处理（已过滤无效引用）
  if (config.referenceList && config.referenceList.length > 0) {
    const validRefs = config.referenceList.filter(
      (ref) => ref && typeof ref.base64 === "string" && ref.base64.length > 0
    );
    if (validRefs.length > 0) {
      instance.referenceImages = validRefs.map((ref, index) => {
        const pureBase64 = extractPureBase64(ref.base64);
        return {
          referenceId: index + 1,
          image: { bytesBase64Encoded: pureBase64 },
        };
      });
    }
  }

  const parameters: any = { sampleCount: 1 };

  // 图片比例：doubao-seedream 等模型使用 aspectRatio 而非 sampleImageSize
  const validRatios = ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"];
  const ratioKey = (config.aspectRatio || "1:1").trim();
  if (validRatios.includes(ratioKey)) {
    parameters.aspectRatio = ratioKey;
  } else {
    logger(`[图片生成] 警告：不支持的比例 ${ratioKey}，已回退为 1:1`);
    parameters.aspectRatio = "1:1";
  }

  const body = { instances: [instance], parameters };

  logger(`[图片生成] 请求: POST ${url}`);
  logger(`[图片生成] 请求体: ${JSON.stringify({ ...body, instances: ["已隐藏 base64 数据"] })}`);

  try {
    const response = await axios.post(url, body, { headers });
    const data = response.data;
    logger(`[图片生成] 响应: ${JSON.stringify(data)}`);

    if (data?.error) {
      throw new Error(`图片生成失败：${data.error.message || data.error.code}`);
    }

    const predictions = data?.predictions || data?.generatedImages || [];
    if (predictions.length === 0) {
      throw new Error("图片生成失败：响应中没有预测结果");
    }

    const result = predictions[0];
    if (result.gcsUri || result.url) {
      const imageUrl = result.gcsUri || result.url;
      logger(`[图片生成] 从URL下载: ${imageUrl}`);
      return await urlToBase64(imageUrl);
    }
    if (result.bytesBase64Encoded) {
      return `data:${result.mimeType || "image/png"};base64,${result.bytesBase64Encoded}`;
    }
    if (result.generatedImage) {
      const img = result.generatedImage;
      const base64Str = img.imageBytes || img.bytesBase64Encoded;
      if (base64Str) {
        return `data:${img.mimeType || "image/png"};base64,${base64Str}`;
      }
    }
    if (result.image && result.image.bytesBase64Encoded) {
      return `data:${result.image.mimeType || "image/png"};base64,${result.image.bytesBase64Encoded}`;
    }
    if (typeof result === "string") {
      return result.startsWith("data:") ? result : `data:image/png;base64,${result}`;
    }

    throw new Error(`图片生成失败：无法识别的响应格式，完整响应: ${JSON.stringify(data)}`);
  } catch (error: any) {
    if (error.response?.data) {
      logger(`[图片生成] 错误响应: ${JSON.stringify(error.response.data)}`);
      const errData = error.response.data;
      throw new Error(
        `图片生成失败：${errData.error?.message || errData.message || JSON.stringify(errData)}`
      );
    }
    throw error;
  }
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  const content: any[] = [];
  if (config.prompt) {
    content.push({ type: "text", text: config.prompt });
  }

  // 安全过滤参考图
  const safeImageRefs = config.referenceList?.filter((r) => r && r.type === "image" && r.base64) ?? [];
  const safeVideoRefs = config.referenceList?.filter((r) => r && r.type === "video" && r.base64) ?? [];
  const safeAudioRefs = config.referenceList?.filter((r) => r && r.type === "audio" && r.base64) ?? [];

  if (typeof config.mode === "string") {
    switch (config.mode) {
      case "singleImage": {
        if (safeImageRefs.length > 0) {
          content.push({
            type: "image_url",
            image_url: { url: safeImageRefs[0].base64 },
            role: "first_frame",
          });
        }
        break;
      }
      case "startFrameOptional": {
        if (safeImageRefs.length > 0) {
          content.push({
            type: "image_url",
            image_url: { url: safeImageRefs[0].base64 },
            role: "first_frame",
          });
          if (safeImageRefs.length > 1) {
            content.push({
              type: "image_url",
              image_url: { url: safeImageRefs[1].base64 },
              role: "last_frame",
            });
          }
        }
        break;
      }
      case "startEndRequired": {
        if (safeImageRefs.length >= 2) {
          content.push({
            type: "image_url",
            image_url: { url: safeImageRefs[0].base64 },
            role: "first_frame",
          });
          content.push({
            type: "image_url",
            image_url: { url: safeImageRefs[1].base64 },
            role: "last_frame",
          });
        }
        break;
      }
      case "endFrameOptional": {
        if (safeImageRefs.length > 0) {
          content.push({
            type: "image_url",
            image_url: { url: safeImageRefs[0].base64 },
            role: "first_frame",
          });
          if (safeImageRefs.length > 1) {
            content.push({
              type: "image_url",
              image_url: { url: safeImageRefs[1].base64 },
              role: "last_frame",
            });
          }
        }
        break;
      }
      case "text":
      default:
        break;
    }
  } else if (Array.isArray(config.mode)) {
    for (const refDef of config.mode) {
      if (typeof refDef === "string") {
        if (refDef.startsWith("imageReference:")) {
          const maxCount = parseInt(refDef.split(":")[1], 10);
          for (const ref of safeImageRefs.slice(0, maxCount)) {
            content.push({
              type: "image_url",
              image_url: { url: ref.base64 },
              role: "reference_image",
            });
          }
        } else if (refDef.startsWith("videoReference:")) {
          const maxCount = parseInt(refDef.split(":")[1], 10);
          for (const ref of safeVideoRefs.slice(0, maxCount)) {
            content.push({
              type: "video_url",
              video_url: { url: ref.base64 },
              role: "reference_video",
            });
          }
        } else if (refDef.startsWith("audioReference:")) {
          const maxCount = parseInt(refDef.split(":")[1], 10);
          for (const ref of safeAudioRefs.slice(0, maxCount)) {
            content.push({
              type: "audio_url",
              audio_url: { url: ref.base64 },
              role: "reference_audio",
            });
          }
        }
      }
    }
  }

  const body: any = {
    model: model.modelName,
    content,
    ratio: config.aspectRatio,
    duration: config.duration,
    resolution: config.resolution || "720p",
    watermark: false,
  };

  if (model.audio === "optional") {
    body.generate_audio = config.audio !== false;
  } else if (model.audio === true) {
    body.generate_audio = true;
  } else {
    body.generate_audio = false;
  }

  logger(`[视频生成] 提交任务, 模型: ${model.modelName}, 时长: ${config.duration}s, 分辨率: ${config.resolution}`);

  const createResponse = await axios.post(`${baseUrl}/contents/generations/tasks`, body, { headers });
  const taskId = createResponse.data?.id;
  if (!taskId) throw new Error("视频生成任务创建失败：未返回任务ID");

  logger(`[视频生成] 任务已创建, ID: ${taskId}`);

  const result = await pollTask(
    async (): Promise<PollResult> => {
      const queryResponse = await axios.get(`${baseUrl}/contents/generations/tasks/${taskId}`, { headers });
      const task = queryResponse.data;

      logger(`[视频生成] 任务状态: ${task.status}`);

      switch (task.status) {
        case "succeeded":
          if (task.content?.video_url) return { completed: true, data: task.content.video_url };
          return { completed: true, error: "任务成功但未返回视频URL" };
        case "failed":
          return { completed: true, error: task.error?.message || "视频生成失败" };
        case "expired":
          return { completed: true, error: "视频生成任务超时" };
        case "cancelled":
          return { completed: true, error: "视频生成任务已取消" };
        default:
          return { completed: false };
      }
    },
    10000,
    600000 * 3,
  );

  if (result.error) throw new Error(result.error);
  return await urlToBase64(result.data!);
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
  return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: "2.0", notice: "" };
};

const updateVendor = async (): Promise<string> => {
  return "";
};

// ============================================================
// 导出
// ============================================================

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

export { };
