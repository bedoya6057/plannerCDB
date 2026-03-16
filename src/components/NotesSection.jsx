import React, { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function NotesSection({ notes, fetchNotes }) {
    const [noteText, setNoteText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteText.trim()) return;
        setLoading(true);

        const { error } = await supabase
            .from('notas')
            .insert([{ texto: noteText }]);

        setLoading(false);

        if (error) {
            console.error('Error inserting note:', error);
            alert('Error al guardar la nota.');
            return;
        }

        setNoteText('');
        fetchNotes();
    };

    const deleteNote = async (id) => {
        setLoading(true);

        const { error } = await supabase
            .from('notas')
            .delete()
            .eq('id', id);

        setLoading(false);

        if (error) {
            console.error('Error deleting note:', error);
            alert('Error al eliminar la nota.');
        } else {
            fetchNotes();
        }
    };

    return (
        <div className="card notes-card">
            <h3>Notas</h3>

            <form onSubmit={handleAddNote} className="note-input-group flex-between">
                <input
                    type="text"
                    placeholder="Escribe una nota rápida aquí..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" className="btn btn-secondary flex-center" disabled={loading}>
                    <Send size={18} />
                </button>
            </form>

            <div className="notes-list">
                {notes.length === 0 ? (
                    <p className="empty-state">No hay notas registradas.</p>
                ) : (
                    notes.map(note => (
                        <div key={note.id} className="note-item" style={{ opacity: loading ? 0.7 : 1 }}>
                            <div className="note-content">
                                <p>{note.text}</p>
                                <span className="note-date">{note.timestamp}</span>
                            </div>
                            <button
                                className="btn-delete"
                                onClick={() => deleteNote(note.id)}
                                title="Eliminar nota"
                                disabled={loading}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
