import React from 'react';

interface SimpleKanbanDialogProps {
    props: any;
    assigneeData: any[];
}

const SimpleKanbanDialog: React.FC<SimpleKanbanDialogProps> = ({ props, assigneeData = [] }) => {
    
    

    return (
        <div style={{ padding: '20px', minWidth: '400px' }}>
            <table style={{ width: '100%', borderSpacing: '0 10px' }}>
                <tbody>
                    <tr>
                        <td className="e-label" style={{ padding: '5px', fontWeight: 'bold', width: '100px' }}>ID:</td>
                        <td style={{ padding: '5px' }}>
                            <div className="e-float-input e-control-wrapper">
                                <input
                                    id="Id"
                                    name="Id"
                                    type="text"
                                    className="e-field"
                                    defaultValue={props.Id || ''}
                                    style={{ width: '100%', padding: '5px', border: '1px solid #ccc' }}
                                />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="e-label" style={{ padding: '5px', fontWeight: 'bold' }}>Status:</td>
                        <td style={{ padding: '5px' }}>
                            <select
                                id="Status"
                                name="Status"
                                className="e-field"
                                defaultValue={props.Status || 'Open'}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc' }}
                            >
                                <option value="Open">Open</option>
                                <option value="InProgress">In Progress</option>
                                <option value="InReview">In Review</option>
                                <option value="Testing">Testing</option>
                                <option value="Close">Close</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td className="e-label" style={{ padding: '5px', fontWeight: 'bold' }}>Summary:</td>
                        <td style={{ padding: '5px' }}>
                            <div className="e-float-input e-control-wrapper">
                                <input
                                    id="Summary"
                                    name="Summary"
                                    type="text"
                                    className="e-field"
                                    defaultValue={props.Summary || ''}
                                    style={{ width: '100%', padding: '5px', border: '1px solid #ccc' }}
                                    placeholder="Enter task summary"
                                />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="e-label" style={{ padding: '5px', fontWeight: 'bold' }}>Type:</td>
                        <td style={{ padding: '5px' }}>
                            <select
                                id="Type"
                                name="Type"
                                className="e-field"
                                defaultValue={props.Type || 'Story'}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc' }}
                            >
                                <option value="Story">Story</option>
                                <option value="Bug">Bug</option>
                                <option value="Epic">Epic</option>
                                <option value="Task">Task</option>
                                <option value="Improvement">Improvement</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td className="e-label" style={{ padding: '5px', fontWeight: 'bold' }}>Priority:</td>
                        <td style={{ padding: '5px' }}>
                            <select
                                id="Priority"
                                name="Priority"
                                className="e-field"
                                defaultValue={props.Priority || 'Normal'}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc' }}
                            >
                                <option value="Low">Low</option>
                                <option value="Normal">Normal</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                                <option value="Release Breaker">Release Breaker</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td className="e-label" style={{ padding: '5px', fontWeight: 'bold' }}>Assignee:</td>
                        <td style={{ padding: '5px' }}>
                            <select
                                id="Assignee"
                                name="Assignee"
                                className="e-field"
                                defaultValue={props.Assignee || ''}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc' }}
                                onChange={(e) => {
                                    // Update the hidden AssigneeName field
                                    const fullName = e.target.value;
                                    const firstName = fullName ? fullName.split(' ')[0] : '';
                                    const assigneeNameField = document.getElementById('AssigneeName') as HTMLInputElement;
                                    if (assigneeNameField) {
                                        assigneeNameField.value = firstName;
                                    }
                                }}
                            >
                                <option value="">Select Assignee</option>
                                {assigneeData && assigneeData.map((item: any, index: number) => {
                                    const firstName = item?.firstName || '';
                                    const lastName = item?.lastName || '';
                                    const fullName = `${firstName} ${lastName}`.trim();
                                    return (
                                        <option key={index} value={fullName}>
                                            {fullName || 'Unknown User'}
                                        </option>
                                    );
                                })}
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td className="e-label" style={{ padding: '5px', fontWeight: 'bold' }}>Description:</td>
                        <td style={{ padding: '5px' }}>
                            <div className="e-float-input e-control-wrapper">
                                <textarea
                                    id="Description"
                                    name="Description"
                                    className="e-field"
                                    defaultValue={props.Description || ''}
                                    rows={3}
                                    style={{ width: '100%', padding: '5px', border: '1px solid #ccc', resize: 'vertical' }}
                                    placeholder="Enter description"
                                />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="e-label" style={{ padding: '5px', fontWeight: 'bold' }}>Tags:</td>
                        <td style={{ padding: '5px' }}>
                            <div className="e-float-input e-control-wrapper">
                                <input
                                    id="Tags"
                                    name="Tags"
                                    type="text"
                                    className="e-field"
                                    defaultValue={props.Tags || ''}
                                    style={{ width: '100%', padding: '5px', border: '1px solid #ccc' }}
                                    placeholder="e.g. Frontend, Bug, Critical"
                                />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            {/* Hidden fields for Syncfusion Kanban */}
            <input
                type="hidden"
                id="AssigneeName"
                name="AssigneeName"
                className="e-field"
                defaultValue={props.AssigneeName || (props.Assignee ? props.Assignee.split(' ')[0] : '')}
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

export default SimpleKanbanDialog;