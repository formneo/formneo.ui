import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { useEffect, useRef, useState, useCallback } from "react";
import { KanbanComponent, ColumnsDirective, ColumnDirective, CardSettingsModel } from "@syncfusion/ej2-react-kanban";
import { KANBAN_COLUMNS } from "./types/kanban.types";

import KanbanToolbar from "./components/KanbanToolbar";
import KanbanCard from "./components/KanbanCard";

import "@syncfusion/ej2-react-kanban/styles/material.css";
import "./styles/kanban.css";
import fetchUserData from "./utils/fetchUserData";
import { KanbanApi, KanbanTasksInsertDto, KanbanTasksListDto, KanbanTasksUpdateDto, UserAppDtoOnlyNameId,UserAppDtoWithoutPhoto } from "api/generated";
import KanbanDialog from "./components/KanbanDialog";
import fetchKanbanData, { KanbanTasksListDtoFixed } from "./utils/fetchKanbanData";
import getConfiguration from "confiuration";
import { useAlert } from "../hooks/useAlert";
import { useBusy } from "../hooks/useBusy";

const styles = `
.e-dialog{
    width: 550px
  }
  `;
  


function KanbanPage() {
  const kanbanRef = useRef<KanbanComponent>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [assigneeData, setAssigneeData] = useState<UserAppDtoWithoutPhoto[]>([]);
  const [filteredData, setFilteredData] = useState<KanbanTasksListDtoFixed[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();


  // Fetch Kanban Data
  const fetchedKanbanData = useCallback(async () => {
    try{
      dispatchBusy({isBusy: true});
      const kanbanData = await fetchKanbanData();
      
      let fixedData : KanbanTasksListDtoFixed[] = kanbanData.map((item: KanbanTasksListDtoFixed) => {
        return {
          Id: item.Id,
          Status: item.Status,
          Summary: item.Summary,
          Type: item.Type,
          Priority: item.Priority,
          Description: item.Description,
          Tags: item.Tags,
          AssigneeId: item.AssigneeId,
          Assignee: item.Assignee,
          RankId: item.RankId,

        
        }
      })
      setFilteredData(kanbanData);
    }catch(error){
      console.error('Error fetching kanban data:', error);
    }finally{
      dispatchBusy({isBusy: false});
    }
  }, []);

  const deleteKanbanData = useCallback(async (id: string) => {
    try{
      dispatchBusy({isBusy: true});
      let config = getConfiguration();
      let api = new KanbanApi(config);
      let response = await api.apiKanbanDelete(id);
      fetchedKanbanData();
    }catch(error){
      console.error('Error fetching kanban data:', error);
    }finally{
      dispatchBusy({isBusy: false});
    }
  }, []);

  const updateKanbanData = useCallback(async (card: KanbanTasksListDtoFixed) => {
    try{
      dispatchBusy({isBusy: true});
      let config = getConfiguration();
      let api = new KanbanApi(config);
      let fixedUpdateCard : KanbanTasksUpdateDto = {
        id: card.Id,
        assigneId: card.AssigneeId,
        rankId: card.RankId,
        priority: card.Priority,
        status: card.Status,
        tags: card.Tags,
        type: card.Type,
        description: card.Description,
        summary: card.Summary,
      }
      let response = await api.apiKanbanPut(fixedUpdateCard);    
      fetchedKanbanData();
    }catch(error){
      console.error('Error updating kanban data:', error);
    }finally{
      dispatchBusy({isBusy: false});
    }
  }, []);

  const addKanbanData = useCallback(async (card: any) => {
    try{
      dispatchBusy({isBusy: true});
      let config = getConfiguration();
      let api = new KanbanApi(config);
      
      let fixedCard : KanbanTasksInsertDto = {
        assigneId: card.AssigneeId,
        rankId: card.RankId,
        priority: card.Priority,
        status: card.Status,
        tags: card.Tags,
        type: card.Type,
        description: card.Description,
        summary: card.Summary,
      }
      let response = await api.apiKanbanPost(fixedCard);
      fetchedKanbanData();
    }catch(error){
      console.error('Error adding kanban data:', error);
    }finally{
      dispatchBusy({isBusy: false});
    }
  }, []);

  const handleAddCard = () => {
    if (kanbanRef.current) {
      kanbanRef.current.openDialog("Add");
    }
  };

  const actionBegin = (args: any) => {
    

    if (args.requestType === 'cardCreate' && args.addedRecords && args.addedRecords.length > 0) {
      const newCard = args.addedRecords[0];
      addKanbanData(newCard);

     
    }
    if (args.requestType === 'cardRemove' && args.deletedRecords && args.deletedRecords.length > 0) {
      const deletedCard = args.deletedRecords[0];
      deleteKanbanData(deletedCard.id);
    }
    if (args.requestType === 'cardChange' && args.changedRecords && args.changedRecords.length > 0) {
      const updatedCard = args.changedRecords[0];
      updateKanbanData(updatedCard);
    }
  };

  const customDialogTemplate = useCallback((props: any) => {
    return <KanbanDialog props={props} assigneeData={assigneeData} />;
  }, [assigneeData]);

  const cardTemplate = useCallback((props: any) => {
    return <KanbanCard data={props} />;
  }, []);

  const handleFilterChange = useCallback((filter: string) => {
    setCurrentFilter(filter);
    applyFilters(filter, searchTerm);
  }, [searchTerm]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    applyFilters(currentFilter, term);
  }, [currentFilter]);

  const applyFilters = useCallback((filter: string, search: string) => {
    let filtered = filteredData;

    // Apply type filter
    if (filter !== 'All') {
      filtered = filtered.filter(item => item.Type === filter);
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.Summary.toLowerCase().includes(searchLower) ||
        item.Description?.toLowerCase().includes(searchLower) ||
        item.Tags.toLowerCase().includes(searchLower) ||
        item.Assignee.toLowerCase().includes(searchLower)
      );
    }

    setFilteredData(filtered);
  }, []);

  const cardSettings: CardSettingsModel = {
    contentField: "Summary",
    headerField: "Id",
    template: cardTemplate,
    selectionType: 'Multiple'
  };

  useEffect(() => {
    fetchUserData().then((data: UserAppDtoWithoutPhoto[]) => {
      if (Array.isArray(data) && data.length > 0) {
        setAssigneeData(data);
      } 
    }).catch((error) => {
      console.error('Error fetching user data:', error);
    });
    fetchedKanbanData();
  }, []);

  useEffect(() => {
    applyFilters(currentFilter, searchTerm);
  }, [applyFilters, currentFilter, searchTerm]);

  return (
    <DashboardLayout>
      <style>{styles}</style>
      <MDBox p={3}>
        <MDTypography variant="h3" mb={3} fontWeight="bold">
          Project Kanban Board
        </MDTypography>

        <KanbanToolbar
          onAddCard={handleAddCard}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
        />

        <KanbanComponent
          id="kanban"
          keyField="Status"
          dataSource={filteredData}
          cardSettings={cardSettings}
          actionBegin={actionBegin}
          swimlaneSettings={{
            keyField: "AssigneeId",
            textField: "Assignee",
            allowDragAndDrop: true
          }}
          ref={kanbanRef}
          dialogSettings={{
            template: customDialogTemplate,
            fields: [
              { text: 'ID', key: 'Id', type: 'TextBox' },
              { text: 'Status', key: 'Status', type: 'DropDown' },
              { text: 'Summary', key: 'Summary', type: 'TextArea' },
              { text: 'Type', key: 'Type', type: 'DropDown' },
              { text: 'Priority', key: 'Priority', type: 'DropDown' },
              { text: 'Assignee', key: 'Assignee', type: 'TextBox' },
              { text: 'AssigneeId', key: 'AssigneeId', type: 'TextBox' },
              { text: 'Description', key: 'Description', type: 'TextArea' },
              { text: 'Tags', key: 'Tags', type: 'TextBox' }
            ]
          }}
          allowKeyboard={true}
          allowDragAndDrop={true}
        // allowToggleColumn={true}
        >
          <ColumnsDirective>
            {KANBAN_COLUMNS.map((column, index) => (
              <ColumnDirective
                key={index}
                headerText={column.headerText}
                keyField={column.keyField}
                allowToggle={column.allowToggle}
                isExpanded={column.isExpanded}
                minCount={column.minCount}
                maxCount={column.maxCount}
              />
            ))}
          </ColumnsDirective>
        </KanbanComponent>
      </MDBox>
    </DashboardLayout>
  );
}

export default KanbanPage;
