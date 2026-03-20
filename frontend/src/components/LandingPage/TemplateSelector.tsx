import type { LandingPageTemplate } from '../../services/landingPageService';

interface TemplateOption {
  id: LandingPageTemplate;
  name: string;
  description: string;
  preview: string;
}

const templates: TemplateOption[] = [
  {
    id: 'hero',
    name: 'Hero',
    description: 'Gran imagen de fondo con llamada a la acción destacada',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'video',
    name: 'Video',
    description: 'Video promocional con formulario de registro',
    preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: 'testimonial',
    name: 'Testimonio',
    description: 'Testimonios de afiliados exitosos',
    preview: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Diseño limpio y profesional',
    preview: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    id: 'gradient',
    name: 'Gradiente',
    description: 'Colores vibrantes con gradiente moderno',
    preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
];

interface TemplateSelectorProps {
  selected: LandingPageTemplate;
  onSelect: (template: LandingPageTemplate) => void;
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() => onSelect(template.id)}
          className={`group relative rounded-lg overflow-hidden border-2 transition-all ${
            selected === template.id
              ? 'border-indigo-600 ring-2 ring-indigo-200'
              : 'border-gray-200 hover:border-indigo-300'
          }`}
        >
          <div className="aspect-video w-full" style={{ background: template.preview }} />
          <div className="p-3 text-left bg-white">
            <p className="font-medium text-gray-900 text-sm">{template.name}</p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
          </div>
          {selected === template.id && (
            <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
