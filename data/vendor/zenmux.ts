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
const parseDataUrl = (dataUrl: string): { base64: string; mimeType: string } => {
  if (!dataUrl || typeof dataUrl !== "string") return { base64: "", mimeType: "image/png" };
  const parts = dataUrl.split(",");
  if (parts.length === 2 && parts[0].includes("base64")) {
    const mimeMatch = parts[0].match(/data:([^;]+);base64/);
    return { base64: parts[1], mimeType: mimeMatch?.[1] || "image/png" };
  }
  return { base64: dataUrl, mimeType: "image/png" };
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
        const parsed = parseDataUrl(ref.base64);
        return {
          referenceId: index + 1,
          image: { bytesBase64Encoded: parsed.base64, mimeType: parsed.mimeType },
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
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");

  const imageBaseUrl = (vendor.inputValues.imageBaseUrl || "").replace(/\/+$/, "") || getBaseUrl();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "")}`,
  };

  const instance: any = { prompt: config.prompt || "" };

  // 参考图：首帧/尾帧
  const safeImageRefs = config.referenceList?.filter((r) => r && r.type === "image" && r.base64) ?? [];

  if (typeof config.mode === "string") {
    switch (config.mode) {
      case "singleImage":
      case "startFrameOptional":
      case "endFrameOptional":
        if (safeImageRefs.length > 0) {
          const parsed = parseDataUrl(safeImageRefs[0].base64);
          instance.referenceImages = [{
            referenceId: 1,
            image: { bytesBase64Encoded: parsed.base64, mimeType: parsed.mimeType },
          }];
        }
        break;
      case "startEndRequired":
        if (safeImageRefs.length >= 2) {
          const first = parseDataUrl(safeImageRefs[0].base64);
          const last = parseDataUrl(safeImageRefs[1].base64);
          instance.referenceImages = [
            { referenceId: 1, image: { bytesBase64Encoded: first.base64, mimeType: first.mimeType } },
            { referenceId: 2, image: { bytesBase64Encoded: last.base64, mimeType: last.mimeType } },
          ];
        }
        break;
    }
  }

  const parameters: any = {
    sampleCount: 1,
    aspectRatio: config.aspectRatio || "16:9",
  };

  const body = { instances: [instance], parameters };

  const url = `${imageBaseUrl}/models/${model.modelName}:predict`;

  logger(`[视频生成] 请求: POST ${url}`);
  logger(`[视频生成] 请求体: ${JSON.stringify({ ...body, instances: ["已隐藏 base64 数据"] })}`);

  try {
    const createResponse = await axios.post(url, body, { headers });
    const data = createResponse.data;
    logger(`[视频生成] 响应: ${JSON.stringify(data)}`);

    if (data?.error) {
      throw new Error(`视频生成失败：${data.error.message || data.error.code}`);
    }

    // 立即完成的响应（predictions 中有视频数据）
    if (data?.predictions?.[0]) {
      const pred = data.predictions[0];
      if (pred.bytesBase64Encoded) {
        return `data:${pred.mimeType || "video/mp4"};base64,${pred.bytesBase64Encoded}`;
      }
      if (pred.gcsUri || pred.url) {
        return await urlToBase64(pred.gcsUri || pred.url);
      }
    }

    // 长时操作：轮询 operation
    const operationName = data?.name;
    if (!operationName) throw new Error("视频生成失败：未返回操作ID");

    logger(`[视频生成] 操作已创建: ${operationName}`);

    const result = await pollTask(
      async (): Promise<PollResult> => {
        const opResponse = await axios.get(`${imageBaseUrl}/${operationName}`, { headers });
        const op = opResponse.data;

        logger(`[视频生成] 操作状态: done=${op.done}`);

        if (op.error) {
          return { completed: true, error: op.error.message || "视频生成失败" };
        }
        if (op.done && op.response) {
          const videos = op.response.generatedVideos || [];
          if (videos.length > 0) {
            const video = videos[0];
            if (video.bytesBase64Encoded) {
              return { completed: true, data: `data:${video.mimeType || "video/mp4"};base64,${video.bytesBase64Encoded}` };
            }
            if (video.gcsUri || video.url) {
              const base64 = await urlToBase64(video.gcsUri || video.url);
              return { completed: true, data: base64 };
            }
          }
          return { completed: true, error: "任务完成但未返回视频数据" };
        }
        return { completed: false };
      },
      10000,
      600000 * 3,
    );

    if (result.error) throw new Error(result.error);
    return result.data!;
  } catch (error: any) {
    if (error.response?.data) {
      logger(`[视频生成] 错误响应: ${JSON.stringify(error.response.data)}`);
      const errData = error.response.data;
      throw new Error(
        `视频生成失败：${errData.error?.message || errData.message || JSON.stringify(errData)}`
      );
    }
    throw error;
  }
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
