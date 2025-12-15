import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Lock, Database, FileText, RefreshCw } from "lucide-react";
import UserAccess from "./user-access";
import { PageAccess } from "./components/PageAccess";
import Backup from "./components/Backup";
import Logs from "./components/Logs";
import { DataSync } from "./components/DataSync";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden p-6 pt-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto flex-shrink-0">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User & Access Management
          </TabsTrigger>
          <TabsTrigger value="page-access" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Page Access
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Data Sync
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="flex-1 overflow-hidden">
          <UserAccess onBack={() => {}} />
        </TabsContent>

        <TabsContent value="page-access" className="flex-1 overflow-hidden">
          <PageAccess />
        </TabsContent>

        <TabsContent value="backup" className="flex-1 overflow-hidden">
          <Backup onBack={() => setActiveTab("users")} />
        </TabsContent>

        <TabsContent value="logs" className="flex-1 overflow-hidden">
          <Logs onBack={() => setActiveTab("users")} />
        </TabsContent>

        <TabsContent value="sync" className="flex-1 overflow-hidden">
          <DataSync />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;