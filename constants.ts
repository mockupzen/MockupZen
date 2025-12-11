
import { MockupScene } from './types';

export const SCENES: MockupScene[] = [
  {
    id: 'studio-white',
    name: 'E-Comm White',
    category: 'Studio',
    prompt: 'Clean, high-key commercial studio setting. Pure white seamless background. Soft, even lighting designed to highlight product clarity. Perfect for Amazon/Shopify listings.'
  },
  {
    id: 'luxury-marble',
    name: 'Luxury Marble',
    category: 'Interior',
    prompt: 'Premium white Carrara marble surface with grey veining. Soft, natural daylight from the side. Elegant, high-end interior atmosphere with depth of field.'
  },
  {
    id: 'lifestyle-wood',
    name: 'Natural Oak',
    category: 'Interior',
    prompt: 'Warm, solid oak wood surface. Golden hour sunlight casting soft organic shadows through a window. Cozy, natural lifestyle vibe with a blurred room background.'
  },
  {
    id: 'bathroom-spa',
    name: 'Spa Counter',
    category: 'Interior',
    prompt: 'Clean ceramic or stone vanity top. Fresh, airy lighting. Background suggests a spa or luxury bathroom environment with soft bokeh. Serene and pure atmosphere.'
  },
  {
    id: 'kitchen-modern',
    name: 'Modern Kitchen',
    category: 'Interior',
    prompt: 'Sleek dark granite or quartz countertop. Modern architectural lighting. Background suggests a premium kitchen with high-end appliances in soft focus.'
  },
  {
    id: 'outdoor-nature',
    name: 'Nature Stone',
    category: 'Outdoor',
    prompt: 'Natural flat stone surface outdoors. Dappled sunlight filtering through trees. Fresh, organic environment with green foliage in the blurred background.'
  },
  {
    id: 'pastel-studio',
    name: 'Pastel Gradient',
    category: 'Studio',
    prompt: 'Smooth, matte pastel color gradient background. Soft, shadowless beauty lighting. Minimalist pop-art aesthetic suitable for trendy brands.'
  },
  {
    id: 'neon-night',
    name: 'Neon Cyber',
    category: 'Creative',
    prompt: 'Dark, moody environment with glossy reflective surfaces. Neon blue and purple rim lighting. Cyberpunk or high-tech night aesthetic.'
  },
  {
    id: 'flatlay-linen',
    name: 'Linen Flat Lay',
    category: 'Interior',
    prompt: 'Top-down (flat lay) view on natural beige linen fabric texture. Soft, diffused window light. Organic, sustainable, and organized composition.'
  },
  {
    id: 'enhanced-white',
    name: 'Premium Studio',
    category: 'Studio',
    prompt: 'Textured off-white or light grey studio wall. Dramatic side lighting creating elegant shadows and form. High-fashion magazine editorial style.'
  },
  {
    id: 'desk-minimal',
    name: 'Minimal Desk',
    category: 'Interior',
    prompt: 'Clean white or light wood workspace desk. Soft daylight. Background hints at a productive, modern tech or creative office setup.'
  },
  {
    id: 'soft-window',
    name: 'Window Light',
    category: 'Studio',
    prompt: 'Product placed near a bright window with sheer white curtains. Ethereal, dreamy, high-key lighting wrapping around the object. Soft and airy.'
  },
  {
    id: 'industrial-loft',
    name: 'Industrial Concrete',
    category: 'Interior',
    prompt: 'Raw concrete texture surface. Dramatic, contrasty lighting. Urban industrial loft aesthetic with architectural shadows.'
  },
  {
    id: 'boho-chic',
    name: 'Boho Rattan',
    category: 'Interior',
    prompt: 'Woven rattan or wicker surface. Warm, earthy tones (terracotta, beige). Dried florals or pampas grass in soft focus background. Bohemian style.'
  },
  {
    id: 'cyber-grid',
    name: 'Retro Grid',
    category: 'Creative',
    prompt: '80s Synthwave aesthetic. Glowing grid floor with a starry horizon. Neon pink and purple lighting. Digital, retro-futuristic vibe.'
  },
  {
    id: 'silk-elegance',
    name: 'Red Silk',
    category: 'Studio',
    prompt: 'Luxurious, flowing red silk fabric. Rich folds and ripples. Dramatic spotlighting to create deep shadows and highlights. Premium elegance.'
  },
  {
    id: 'forest-floor',
    name: 'Forest Moss',
    category: 'Outdoor',
    prompt: 'Natural green mossy surface in a deep forest. Dappled light through canopy. Earthy, grounded, organic feel with macro details.'
  },
  {
    id: 'terrazzo-pop',
    name: 'Terrazzo Pop',
    category: 'Creative',
    prompt: 'Bright colorful terrazzo stone surface. Even, bright lighting. Playful, modern, and geometric composition.'
  },
  {
    id: 'golden-hour',
    name: 'Golden Sun',
    category: 'Outdoor',
    prompt: 'Textured wall or surface bathed in warm, low-angle golden hour sunlight. Long shadows. Nostalgic, summer evening atmosphere.'
  },
  {
    id: 'midnight-luxury',
    name: 'Midnight Matte',
    category: 'Studio',
    prompt: 'Deep matte black background. Gold or cool white rim lighting to define the product silhouette. Minimalist, premium, masculine aesthetic.'
  }
];

export const VARIATION_PROMPTS = [
  "Front view, eye level, symmetrical composition.",
  "Slightly angled left (15 degrees), showing depth.",
  "Slightly angled right (15 degrees), dynamic stance.",
  "3/4 view from the left, highlighting side details.",
  "3/4 view from the right, commercial standard angle.",
  "Low angle 'Hero' shot, looking slightly up at the product.",
  "High angle, soft top-down perspective.",
  "Direct overhead Flat Lay (90 degrees).",
  "Close-up crop focusing on texture and material.",
  "Medium framing with negative space for text.",
  "Wide environmental shot with blurred background context.",
  "Product rotated slightly clockwise for informal feel.",
  "Product rotated slightly counter-clockwise.",
  "Macro detail shot with shallow depth of field.",
  "Framed with foreground bokeh elements.",
  "Dynamic diagonal composition on the surface.",
  "Backlit rim lighting angle for silhouette definition.",
  "Top-down angle with dramatic side shadows.",
  "Elevated/Floating composition if appropriate, or resting naturally.",
  "Lifestyle context angle, casual and realistic."
];
