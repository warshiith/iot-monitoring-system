from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import manager

router = APIRouter()


@router.websocket("/ws/readings")
async def websocket_readings(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({"type": "connection", "status": "connected"})
        while True:
            # Keep the connection alive; clients don't need to send anything,
            # but we read to detect disconnects promptly.
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
