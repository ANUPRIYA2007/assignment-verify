import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../hooks/useRealtime';
import toast from 'react-hot-toast';

/**
 * Global real-time notification component.
 * Mounted at App level — shows toasts when assignments or submissions change.
 */
export default function RealtimeToast() {
    const { user } = useAuth();

    // Students: listen for new assignments
    useRealtime('assignments', {
        enabled: !!user && user.role === 'student',
        onInsert: (newAssignment) => {
            toast('📝 New assignment posted: ' + newAssignment.title, {
                icon: '🔔',
                style: {
                    background: '#fff',
                    color: '#1E1B3A',
                    border: '1px solid #E5E0F6',
                    borderRadius: 12
                },
                duration: 5000
            });
        }
    });

    // Teachers: listen for new submissions on their assignments
    useRealtime('submissions', {
        enabled: !!user && user.role === 'teacher',
        onInsert: (newSubmission) => {
            toast('📤 New submission received!', {
                icon: '🔔',
                style: {
                    background: '#fff',
                    color: '#1E1B3A',
                    border: '1px solid #E5E0F6',
                    borderRadius: 12
                },
                duration: 4000
            });
        },
        onUpdate: (updatedSubmission) => {
            if (updatedSubmission.status === 'evaluated') return; // ignore our own evaluations
        }
    });

    // Admin: listen for everything
    useRealtime('assignments', {
        enabled: !!user && user.role === 'admin',
        onInsert: (newAssignment) => {
            toast('📝 New assignment: ' + newAssignment.title, {
                icon: '⚙️',
                style: {
                    background: '#fff',
                    color: '#1E1B3A',
                    border: '1px solid #E5E0F6',
                    borderRadius: 12
                },
                duration: 4000
            });
        }
    });

    useRealtime('submissions', {
        enabled: !!user && user.role === 'admin',
        onInsert: () => {
            toast('📤 New submission received', {
                icon: '⚙️',
                style: {
                    background: '#fff',
                    color: '#1E1B3A',
                    border: '1px solid #E5E0F6',
                    borderRadius: 12
                },
                duration: 3000
            });
        }
    });

    return null; // Render nothing — purely a side-effect component
}
