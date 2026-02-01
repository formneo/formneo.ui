import React from 'react';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, TYPE_OPTIONS } from '../types/kanban.types';
import { UserAppDtoOnlyNameId,UserAppDtoWithoutPhoto } from "api/generated";

interface KanbanDialogProps {
    props: any;
    assigneeData: UserAppDtoWithoutPhoto[];
}

const KanbanDialog: React.FC<KanbanDialogProps> = ({ props, assigneeData = [] }) => {
    
    

    const dialogStyles = {
        container: {
            padding: '24px',
            // backgroundColor: '#ffffff',
            // borderRadius: '12px',
            // boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        header: {
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
        },
        title: {
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '24px'
        },
        fieldGroup: {
            display: 'flex',
            flexDirection: 'column' as const
        },
        fullWidth: {
            gridColumn: '1 / -1'
        },
        label: {
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px',
            display: 'block'
        },
        input: {
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: '#ffffff',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxSizing: 'border-box' as const
        },
        select: {
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: '#ffffff',
            transition: 'all 0.2s ease',
            outline: 'none',
            cursor: 'pointer',
            boxSizing: 'border-box' as const
        },
        textarea: {
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: '#ffffff',
            transition: 'all 0.2s ease',
            outline: 'none',
            resize: 'vertical' as const,
            minHeight: '100px',
            fontFamily: 'inherit',
            boxSizing: 'border-box' as const
        },
        buttonGroup: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
            marginTop: '24px'
        },
        button: {
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s ease'
        },
        deleteButton: {
            backgroundColor: '#ef4444',
            color: '#ffffff',
            marginRight: 'auto'
        },
        cancelButton: {
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db'
        },
        saveButton: {
            backgroundColor: '#3b82f6',
            color: '#ffffff'
        }
    };

    return (
        <div style={dialogStyles.container}>


            <div style={dialogStyles.grid}>
                <div style={dialogStyles.fieldGroup}>
                    <label style={dialogStyles.label}>Task ID</label>
                    <input
                        id="Id"
                        name="Id"
                        type="text"
                        className="e-field"
                        disabled
                        readOnly
                        defaultValue={props.Id || ''}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: '#f9fafb',
                            color: '#6b7280',
                            cursor: 'not-allowed',
                            transition: 'all 0.2s ease',
                            outline: 'none',
                            boxSizing: 'border-box' as const
                        }}
                    />
                </div>

                <div style={dialogStyles.fieldGroup}>
                    <label style={dialogStyles.label}>Status</label>
                    <select
                        id='Status'
                        name="Status"
                        className="e-field"
                        defaultValue={props.Status || 'Open'}
                        style={dialogStyles.select}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    >
                        {STATUS_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                <div style={dialogStyles.fieldGroup}>
                    <label style={dialogStyles.label}>Type</label>
                    <select
                        id='Type'
                        name="Type"
                        className="e-field"
                        defaultValue={props.Type || 'Story'}
                        style={dialogStyles.select}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    >
                        {TYPE_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                <div style={dialogStyles.fieldGroup}>
                    <label style={dialogStyles.label}>Priority</label>
                    <select
                        id='Priority'
                        name="Priority"
                        className="e-field"
                        defaultValue={props.Priority || 'Normal'}
                        style={dialogStyles.select}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    >
                        {PRIORITY_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                <div style={{ ...dialogStyles.fieldGroup, ...dialogStyles.fullWidth }}>
                    <label style={dialogStyles.label}>Assignee</label>
                    <select
                        id='Assignee'
                        name="Assignee"
                        className="e-field"
                        defaultValue={props.Assignee || ''}
                        style={dialogStyles.select}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        onChange={(e) => {
                            const selectedOption = e.target.selectedOptions[0];
                            const assigneeId = selectedOption.getAttribute('data-id') || '';
                            const assigneeIdField = document.getElementById('AssigneeId') as HTMLInputElement;
                            if (assigneeIdField) {
                                assigneeIdField.value = assigneeId;
                            }
                        }}
                    >
                        <option value="">Select Assignee</option>
                        {assigneeData && assigneeData.map((item: UserAppDtoWithoutPhoto) => {
                            const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim();
                            return (
                                <option key={item.id} value={fullName} data-id={item.id}>
                                    {fullName || 'Unknown User'}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div style={{ ...dialogStyles.fieldGroup, ...dialogStyles.fullWidth }}>
                    <label style={dialogStyles.label}>Summary</label>
                    <input
                        id="Summary"
                        name="Summary"
                        type="text"
                        className="e-field"
                        defaultValue={props.Summary || ''}
                        placeholder="Enter task summary"
                        style={dialogStyles.input}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                </div>

                <div style={{ ...dialogStyles.fieldGroup, ...dialogStyles.fullWidth }}>
                    <label style={dialogStyles.label}>Description</label>
                    <textarea
                        id="Description"
                        name="Description"
                        className="e-field"
                        defaultValue={props.Description || ''}
                        placeholder="Enter detailed description"
                        style={dialogStyles.textarea}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                </div>

                <div style={{ ...dialogStyles.fieldGroup, ...dialogStyles.fullWidth }}>
                    <label style={dialogStyles.label}>Tags (comma separated)</label>
                    <input
                        id="Tags"
                        name="Tags"
                        type="text"
                        className="e-field"
                        defaultValue={props.Tags || ''}
                        placeholder="e.g. Frontend, Bug, Critical"
                        style={dialogStyles.input}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                </div>
            </div>



            {/* Hidden fields for Syncfusion Kanban */}
            <input
                type="hidden"
                id="AssigneeId"
                name="AssigneeId"
                className="e-field"
                defaultValue={props.AssigneeId || ''}
            />
            <input
                type="hidden"
                id="RankId"
                name="RankId"
                className="e-field"
                defaultValue={props.RankId || 1}
            />
        </div>
    );
};

export default KanbanDialog;