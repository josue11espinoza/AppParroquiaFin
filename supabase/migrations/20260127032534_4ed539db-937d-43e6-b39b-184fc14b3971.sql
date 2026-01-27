-- Tabla de sacerdotes/padres
CREATE TABLE public.priests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de horarios de sacerdotes
CREATE TABLE public.priest_schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    priest_id UUID NOT NULL REFERENCES public.priests(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    activity TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tipos de sacramentos
CREATE TYPE public.sacrament_type AS ENUM ('bautismo', 'primera_comunion', 'confirmacion', 'matrimonio');

-- Tabla de personas/feligreses
CREATE TABLE public.parishioners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dni TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de sacramentos recibidos
CREATE TABLE public.sacraments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parishioner_id UUID NOT NULL REFERENCES public.parishioners(id) ON DELETE CASCADE,
    sacrament_type sacrament_type NOT NULL,
    ceremony_date DATE NOT NULL,
    church_name TEXT,
    priest_name TEXT,
    godfather_name TEXT,
    godmother_name TEXT,
    book_number TEXT,
    page_number TEXT,
    entry_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.priests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priest_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parishioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sacraments ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de lectura (para aplicación interna de parroquia)
CREATE POLICY "Allow public read priests" ON public.priests FOR SELECT USING (true);
CREATE POLICY "Allow public insert priests" ON public.priests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update priests" ON public.priests FOR UPDATE USING (true);
CREATE POLICY "Allow public delete priests" ON public.priests FOR DELETE USING (true);

CREATE POLICY "Allow public read schedules" ON public.priest_schedules FOR SELECT USING (true);
CREATE POLICY "Allow public insert schedules" ON public.priest_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update schedules" ON public.priest_schedules FOR UPDATE USING (true);
CREATE POLICY "Allow public delete schedules" ON public.priest_schedules FOR DELETE USING (true);

CREATE POLICY "Allow public read parishioners" ON public.parishioners FOR SELECT USING (true);
CREATE POLICY "Allow public insert parishioners" ON public.parishioners FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update parishioners" ON public.parishioners FOR UPDATE USING (true);
CREATE POLICY "Allow public delete parishioners" ON public.parishioners FOR DELETE USING (true);

CREATE POLICY "Allow public read sacraments" ON public.sacraments FOR SELECT USING (true);
CREATE POLICY "Allow public insert sacraments" ON public.sacraments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update sacraments" ON public.sacraments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete sacraments" ON public.sacraments FOR DELETE USING (true);

-- Índices para búsqueda
CREATE INDEX idx_parishioners_dni ON public.parishioners(dni);
CREATE INDEX idx_parishioners_name ON public.parishioners(first_name, last_name);
CREATE INDEX idx_sacraments_type ON public.sacraments(sacrament_type);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_priests_updated_at
    BEFORE UPDATE ON public.priests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parishioners_updated_at
    BEFORE UPDATE ON public.parishioners
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();