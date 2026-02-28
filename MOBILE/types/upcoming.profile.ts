export interface UpcomingProfile {
    id: string;
    title: string;
    subtitle: string;
    status: "Not Started" | "In Progress" | "Ongoing";
    icon: React.ComponentType<any>;
}