import { Church, Users, BookOpen, Calendar, Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickActions = [
  {
    title: "Buscar Registros",
    description: "Busca personas por DNI o nombre",
    icon: Search,
    href: "/search",
    variant: "primary" as const,
  },
  {
    title: "Nuevo Feligrés",
    description: "Registrar nueva persona",
    icon: Users,
    href: "/parishioners",
    variant: "default" as const,
  },
  {
    title: "Registrar Sacramento",
    description: "Bautismo, comunión, confirmación",
    icon: BookOpen,
    href: "/sacraments",
    variant: "default" as const,
  },
  {
    title: "Ver Horarios",
    description: "Horarios de los sacerdotes",
    icon: Calendar,
    href: "/schedules",
    variant: "default" as const,
  },
];

const stats = [
  { label: "Feligreses", value: "—", icon: Users },
  { label: "Bautizos", value: "—", icon: BookOpen },
  { label: "Comuniones", value: "—", icon: BookOpen },
  { label: "Sacerdotes", value: "—", icon: Church },
];

export default function Index() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gold-gradient mb-6 shadow-gold">
            <Church className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">
            Sistema Parroquial
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Gestión de sacramentos, feligreses y horarios de la parroquia
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={action.title} to={action.href}>
              <Card 
                className={`card-parish cursor-pointer group h-full ${
                  action.variant === "primary" ? "border-primary/30 bg-primary/5" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                    action.variant === "primary" 
                      ? "gold-gradient shadow-gold" 
                      : "bg-muted"
                  }`}>
                    <action.icon className={`w-6 h-6 ${
                      action.variant === "primary" 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground"
                    }`} />
                  </div>
                  <CardTitle className="text-lg font-serif group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Ir ahora
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <Card className="card-parish">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Resumen General</CardTitle>
            <CardDescription>
              Estadísticas de la parroquia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center p-4 rounded-lg bg-muted/50">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold text-foreground font-serif">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">
            Use el menú lateral para navegar entre las diferentes secciones del sistema
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
