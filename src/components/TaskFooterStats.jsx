import React from 'react';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

export default function TaskFooterStats({ tasks }) {
    // Only calculate for non-executed tasks
    const pendingTasks = tasks.filter(task => !task.ejecutado);
    const total = pendingTasks.length;

    let vigente = 0;
    let porVencer = 0;
    let vencido = 0;

    const today = startOfDay(new Date());

    pendingTasks.forEach(task => {
        if (!task.fechaLimite) return;

        // We use fechaReprogramacion if it exists, otherwise fechaLimite
        const limitDateStr = task.fechaReprogramacion || task.fechaLimite;
        const limitDate = startOfDay(parseISO(limitDateStr));

        const diffDays = differenceInDays(limitDate, today);

        if (diffDays > 2) {
            vigente++;
        } else if (diffDays >= 0 && diffDays <= 2) {
            porVencer++;
        } else {
            vencido++;
        }
    });

    const getPercent = (count) => {
        if (total === 0) return 0;
        return Math.round((count / total) * 100);
    };

    return (
        <div className="footer-stats">
            <div className="container stats-container">
                <div className="stat-item vigente">
                    <div className="stat-label">Vigentes (&gt; 2 días)</div>
                    <div className="stat-value">{vigente}</div>
                    <div className="stat-percent">{getPercent(vigente)}%</div>
                </div>

                <div className="stat-item por-vencer">
                    <div className="stat-label">Por Vencer (0-2 días)</div>
                    <div className="stat-value">{porVencer}</div>
                    <div className="stat-percent">{getPercent(porVencer)}%</div>
                </div>

                <div className="stat-item vencido">
                    <div className="stat-label">Vencidas (&lt; 0 días)</div>
                    <div className="stat-value">{vencido}</div>
                    <div className="stat-percent">{getPercent(vencido)}%</div>
                </div>

                <div className="stat-item total">
                    <div className="stat-label">Total Pendientes</div>
                    <div className="stat-value">{total}</div>
                    <div className="stat-percent">100%</div>
                </div>
            </div>
        </div>
    );
}
