import React from "react";
import { Info, Globe, AlertTriangle, ShieldAlert } from "lucide-react";

export type BotSeverity = "safe" | "seo" | "warning" | "danger";

export interface BotClassification {
  name: string;
  type: string;
  intent: string;
  severity: BotSeverity;
  recommendation: string;
}

export function classifyBot(userAgent: string): BotClassification {
  const ua = (userAgent || "").toLowerCase();

  if (ua.includes("googlebot"))
    return { name: "Googlebot", type: "Rastreador de busca", intent: "Indexação SEO (Google)", severity: "safe", recommendation: "Nenhuma ação necessária. Garanta um sitemap.xml atualizado para melhor indexação." };
  if (ua.includes("bingbot") || ua.includes("bingpreview"))
    return { name: "Bingbot", type: "Rastreador de busca", intent: "Indexação SEO (Bing)", severity: "safe", recommendation: "Nenhuma ação necessária. Considere cadastrar o site no Bing Webmaster Tools." };
  if (ua.includes("yandexbot") || ua.includes("yandex"))
    return { name: "YandexBot", type: "Rastreador de busca", intent: "Indexação SEO (Yandex)", severity: "safe", recommendation: "Nenhuma ação necessária." };
  if (ua.includes("duckduckbot"))
    return { name: "DuckDuckBot", type: "Rastreador de busca", intent: "Indexação SEO (DuckDuckGo)", severity: "safe", recommendation: "Nenhuma ação necessária." };
  if (ua.includes("baiduspider"))
    return { name: "Baiduspider", type: "Rastreador de busca", intent: "Indexação SEO (Baidu, China)", severity: "safe", recommendation: "Nenhuma ação necessária, tráfego esperado de mercado chinês." };
  if (ua.includes("slurp"))
    return { name: "Yahoo Slurp", type: "Rastreador de busca", intent: "Indexação SEO (Yahoo)", severity: "safe", recommendation: "Nenhuma ação necessária." };
  if (ua.includes("applebot"))
    return { name: "Applebot", type: "Rastreador de busca", intent: "Indexação para Spotlight/Siri", severity: "safe", recommendation: "Nenhuma ação necessária." };
  if (ua.includes("facebookexternalhit") || ua.includes("facebot"))
    return { name: "Facebook Bot", type: "Pré-visualização social", intent: "Geração de preview ao compartilhar links no Facebook/Instagram", severity: "safe", recommendation: "Adicione meta tags Open Graph para melhorar previews." };
  if (ua.includes("twitterbot"))
    return { name: "TwitterBot", type: "Pré-visualização social", intent: "Geração de preview ao compartilhar no X/Twitter", severity: "safe", recommendation: "Adicione meta tags Twitter Card ao site." };
  if (ua.includes("linkedinbot"))
    return { name: "LinkedInBot", type: "Pré-visualização social", intent: "Geração de preview no LinkedIn", severity: "safe", recommendation: "Adicione meta tags Open Graph para melhorar previews." };
  if (ua.includes("whatsapp"))
    return { name: "WhatsApp Bot", type: "Pré-visualização social", intent: "Geração de preview ao compartilhar links no WhatsApp", severity: "safe", recommendation: "Adicione meta tags Open Graph para melhorar previews." };
  if (ua.includes("telegrambot"))
    return { name: "TelegramBot", type: "Pré-visualização social", intent: "Geração de preview ao compartilhar no Telegram", severity: "safe", recommendation: "Adicione meta tags Open Graph para melhorar previews." };
  if (ua.includes("uptimerobot"))
    return { name: "UptimeRobot", type: "Monitoramento", intent: "Verificação de disponibilidade do site", severity: "safe", recommendation: "Esperado se você usa UptimeRobot." };
  if (ua.includes("pingdom"))
    return { name: "Pingdom", type: "Monitoramento", intent: "Monitoramento de disponibilidade e performance", severity: "safe", recommendation: "Esperado se você usa Pingdom." };
  if (ua.includes("gtmetrix"))
    return { name: "GTmetrix", type: "Análise de performance", intent: "Análise de velocidade do site", severity: "safe", recommendation: "Esperado se você usa GTmetrix para análises." };
  if (ua.includes("pagespeed") || ua.includes("lighthouse"))
    return { name: "PageSpeed/Lighthouse", type: "Análise de performance", intent: "Auditoria de velocidade (Google)", severity: "safe", recommendation: "Esperado, tráfego legítimo." };
  if (ua.includes("ahrefsbot"))
    return { name: "AhrefsBot", type: "Ferramenta SEO", intent: "Análise de backlinks e conteúdo (Ahrefs)", severity: "seo", recommendation: "Pode ser bloqueado via robots.txt se não desejar que a Ahrefs rastreie o site." };
  if (ua.includes("semrushbot"))
    return { name: "SemrushBot", type: "Ferramenta SEO", intent: "Análise de palavras-chave e competidores (SEMrush)", severity: "seo", recommendation: "Pode ser bloqueado via robots.txt: 'User-agent: SemrushBot\\nDisallow: /'" };
  if (ua.includes("mj12bot"))
    return { name: "MJ12Bot", type: "Ferramenta SEO", intent: "Análise de links (Majestic SEO)", severity: "seo", recommendation: "Pode ser bloqueado via robots.txt se não quiser rastreamento da Majestic." };
  if (ua.includes("dotbot"))
    return { name: "DotBot", type: "Ferramenta SEO", intent: "Análise de links (Moz)", severity: "seo", recommendation: "Pode ser bloqueado via robots.txt." };
  if (ua.includes("rogerbot"))
    return { name: "Rogerbot", type: "Ferramenta SEO", intent: "Rastreador da Moz", severity: "seo", recommendation: "Pode ser bloqueado via robots.txt." };
  if (ua.includes("petalbot"))
    return { name: "PetalBot", type: "Rastreador de busca", intent: "Indexação para Huawei/Petal Search", severity: "seo", recommendation: "Nenhuma ação necessária, tráfego esperado." };
  if (ua.includes("go-http-client"))
    return { name: "Go HTTP Client", type: "Script automatizado (Go)", intent: "Scraping ou automação via linguagem Go", severity: "warning", recommendation: "Verifique o IP de origem. Se repetitivo, considere adicionar rate-limiting ou bloquear o IP no firewall/CDN." };
  if (ua.includes("python-requests") || ua.includes("python-urllib"))
    return { name: "Python Script", type: "Script automatizado (Python)", intent: "Scraping ou automação via Python", severity: "warning", recommendation: "Verifique o IP de origem. Se repetitivo, implemente CAPTCHA ou rate-limiting." };
  if (ua.includes("java/") || ua.includes("apache-httpclient") || ua.includes("okhttp"))
    return { name: "Java HTTP Client", type: "Script automatizado (Java)", intent: "Scraping ou automação via Java", severity: "warning", recommendation: "Verifique o IP de origem. Se repetitivo, aplique rate-limiting." };
  if (ua.startsWith("curl"))
    return { name: "cURL", type: "Ferramenta CLI", intent: "Teste manual ou script de automação", severity: "warning", recommendation: "Geralmente inofensivo se volume baixo. Se repetitivo de um mesmo IP, monitore." };
  if (ua.startsWith("wget"))
    return { name: "wget", type: "Ferramenta CLI", intent: "Download ou scraping via wget", severity: "warning", recommendation: "Se repetitivo de um mesmo IP, considere bloquear no firewall." };
  if (ua.includes("scrapy"))
    return { name: "Scrapy", type: "Framework de scraping", intent: "Extração massiva de dados via Scrapy", severity: "danger", recommendation: "Alto risco de extração de dados. Implemente CAPTCHA, rate-limiting e analise o IP para possível bloqueio." };
  if (ua.includes("puppeteer") || ua.includes("playwright") || ua.includes("headlesschrome") || ua.includes("headless"))
    return { name: "Navegador headless", type: "Automação de browser", intent: "Scraping ou automação com browser headless", severity: "danger", recommendation: "Possível tentativa de bypass de proteções. Considere implementar CAPTCHA ou Cloudflare Bot Management." };
  if (ua.includes("selenium"))
    return { name: "Selenium", type: "Automação de browser", intent: "Testes automatizados ou scraping via Selenium", severity: "warning", recommendation: "Pode ser scraping ou testes. Monitore o IP de origem." };
  if (!ua || ua.trim() === "")
    return { name: "Sem User Agent", type: "Acesso suspeito", intent: "Acesso sem identificação (possível scanner ou bot primitivo)", severity: "danger", recommendation: "Bloquear requisições sem User-Agent no servidor ou CDN é uma boa prática de segurança." };

  return { name: "Bot desconhecido", type: "Desconhecido", intent: "Origem não identificada", severity: "warning", recommendation: "Monitore a frequência de acessos deste agente e o IP de origem." };
}

export const BOT_SEVERITY_STYLES: Record<BotSeverity, { badge: string; row: string; icon: React.ReactNode }> = {
  safe: { badge: "bg-green-100 text-green-800 border-green-200", row: "", icon: <Info className="h-3 w-3 text-green-600" /> },
  seo: { badge: "bg-blue-100 text-blue-800 border-blue-200", row: "", icon: <Globe className="h-3 w-3 text-blue-600" /> },
  warning: { badge: "bg-yellow-100 text-yellow-800 border-yellow-200", row: "bg-yellow-50/30", icon: <AlertTriangle className="h-3 w-3 text-yellow-600" /> },
  danger: { badge: "bg-red-100 text-red-800 border-red-200", row: "bg-red-50/30", icon: <ShieldAlert className="h-3 w-3 text-red-600" /> },
};
