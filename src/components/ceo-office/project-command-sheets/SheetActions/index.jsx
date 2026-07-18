import React from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEdit, FaTrash, FaSyncAlt } from 'react-icons/fa';
import './index.css';

const ViewAction = ({ sheetId }) => (
  <Link 
    to={`/ceo-office/project-command-sheets/${sheetId}`} 
    className="pcs-action-view"
    title="View"
  >
    <FaEye />
  </Link>
);

const ConvertAction = ({ onClick, disabled, title }) => (
  <button 
    onClick={onClick} 
    className="pcs-action-convert"
    title={title}
    disabled={disabled}
  >
    <FaSyncAlt />
  </button>
);

const EditAction = ({ onClick }) => (
  <button 
    onClick={onClick} 
    className="pcs-action-edit"
    title="Edit"
  >
    <FaEdit />
  </button>
);

const DeleteAction = ({ onClick }) => (
  <button 
    onClick={onClick} 
    className="pcs-action-delete"
    title="Delete"
  >
    <FaTrash />
  </button>
);

const SheetActions = ({ sheet, onEdit, onDelete, onConvert }) => (
  <div className="pcs-sheet-actions">
    {sheet.is_ceo_note ? (
      <Link 
        to={`/ceo-office/notes/${sheet.related_note_id}`} 
        className="pcs-action-view"
        title="View"
      >
        <FaEye />
      </Link>
    ) : (
      <ViewAction sheetId={sheet.id} />
    )}
    <ConvertAction 
      onClick={() => onConvert(sheet)} 
      disabled={sheet.related_task_id}
      title={sheet.related_task_id ? 'Already converted' : 'Convert to Task'}
    />
    <EditAction onClick={() => onEdit(sheet)} />
    <DeleteAction onClick={() => onDelete(sheet)} />
  </div>
);

export { ViewAction, EditAction, DeleteAction, SheetActions, ConvertAction };
