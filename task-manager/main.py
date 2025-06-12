from typing import List
from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import lmstudio as lms
import httpx
import os
import openai
import base64
app = FastAPI()

# Data model
class TaskInfo(BaseModel):
    name: str
    description: str
class VisualPrompt(BaseModel):
    text: str
    image64: str

#TASK_MONITOR_URL = "http://agstudio.local:6010"  # Example backend
TASK_MONITOR_URL = os.getenv("TASK_MONITOR_URL", "http://localhost:8002" )
OPENAI_MIDDLE_URL = os.getenv("OPENAI_MIDDLE_URL", "http://localhost:1234" )
VLM_MODEL = os.getenv("VLM_MODEL", "gemma-3-27b-it-qat" )
MUSIC_HIGHLIGHT_URL=os.getenv("MUSIC_HIGHLIGHT_URL", "http://localhost:8101")
MUSIC_CAPTION_URL=os.getenv("MUSIC_CAPTION_URL", "http://localhost:8102")
async def add_task(task_info: TaskInfo):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{TASK_MONITOR_URL}/api/task", json=task_info.model_dump())
        return response.json()

async def submit_task(request: Request):
    data = await request.json()
    cookies = request.cookies  # get sid

    if not data.get("name") or not data.get("description"):
        return JSONResponse(status_code=400, content={"error": "Missing data"})

    # Forward to Next.js
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{TASK_MONITOR_URL}/api/task",
            json={"name": data["name"], "description": data["description"]},
            cookies={"sid": cookies.get("sid")},  # forward the session cookie
        )

    return JSONResponse(status_code=res.status_code, content=res.json())

@app.post("/init-session")
async def init_session():
    async with httpx.AsyncClient(follow_redirects=True) as client:
        monitor_response = await client.get(f"{TASK_MONITOR_URL}/init-session")
        # Extract session cookie
        set_cookie = monitor_response.headers.get("Set-Cookie")
        if not set_cookie:
            raise HTTPException(status_code=500, detail="Session cookie not received from task monitor.")

        # Return the session cookie to client
        return JSONResponse(content="Session initialized", headers={"Set-Cookie": set_cookie})
@app.post("/basic-story-format")
async def basic_story_format(request: Request):
    data = await request.json()
    EXTERNAL_BACKEND_URL = "http://agstudio.local:7000/basic-format"  # Example backend
    async with httpx.AsyncClient() as client:
        response = await client.post(EXTERNAL_BACKEND_URL, json=data.dict())
        return response.json()
@app.post("/story-add-emotion")
async def story_add_emotion(request: Request):
    data = await request.json()
    EXTERNAL_BACKEND_URL = "http://agstudio.local:7000/add-character-emotion"  # Example backend
    async with httpx.AsyncClient() as client:
        response = await client.post(EXTERNAL_BACKEND_URL, json=data.model_dump())
        return response.json()
client = openai.OpenAI(
    base_url=OPENAI_MIDDLE_URL,  # Adjust if using a different endpoint
    api_key="your-openai-api-key",  # Replace with your actual API key
    # Or use environment variable: api_key=os.getenv("OPENAI_API_KEY")
)

@app.post("/multimodal-input")
async def multimodal_input(
    prompt: str = Form(...),
    images: List[UploadFile] = File([]),
    audios: List[UploadFile] = File([]),
):
    if( not images.empty() and audios.empty()):
        # Process as image
        return vqa(prompt, images, audios, OPENAI_MIDDLE_URL, VLM_MODEL)
    elif not audios.empty() and images.empty():
        # Process as audio
        return music_caption(prompt, images, audios, OPENAI_MIDDLE_URL, VLM_MODEL)
    else:
        # Invalid combination
        return JSONResponse(
            content={"error": "Full multimodal input is not supported yet. Please provide either images or audios, but not both."},
            status_code=400
        )


@app.post("/music-caption")
async def music_caption(
    prompt: str = Form(...),
    audios: List[UploadFile] = File([]),
):
    return await inner_general_post(prompt, [], audios, MUSIC_CAPTION_URL)
@app.post("/music-highlight")
async def music_highlight(
    prompt: str = Form(...),
    audios: List[UploadFile] = File([]),
):
    return await inner_general_post(prompt, [], audios, MUSIC_HIGHLIGHT_URL)
@app.post("/vqa")
async def vqa(
    question: str = Form(...),  # Text field
    file: UploadFile = File(...)  # Image file
):
    return inner_openai(question, file, OPENAI_MIDDLE_URL, VLM_MODEL)
async def inner_openai(
    prompt: str,
    images: List[UploadFile],
    audios: List[UploadFile],
    model: str = VLM_MODEL  # Default to the VLM model
):
    # Read and encode the images
    base64_images = []
    print(f"Processing images: {len(images)}")
    for img in images:
        image_data = await img.read()
        base64_image = base64.b64encode(image_data).decode('utf-8')
        base64_images.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:{img.content_type};base64,{base64_image}"
            }
        })

    # Read and encode the audios
    base64_audios = []
    print(f"Processing audios: {len(audios)}")
    for audio in audios:
        audio_data = await audio.read()
        base64_audio = base64.b64encode(audio_data).decode('utf-8')
        base64_audios.append({
            "type": "audio_url",
            "audio_url": {
                "url": f"data:{audio.content_type};base64,{base64_audio}"
            }
        })

    try:
        print(f"Creating chat completion with model: {model}")
        # Create the chat completion with vision
        response = client.chat.completions.create(
            model=model,  # Use gpt-4o or gpt-4-vision-preview for vision capabilities
            messages = [
                {"role": "user", "content": [

                    {"type": "text", "text": prompt},
                    *base64_images
                    #,*base64_audios
                ]
                }
            ],
            max_tokens=1000  # Adjust as needed
        )
        answer = response.choices[0].message.content
        print(f"VQA Answer: {answer}")
        return JSONResponse(content={"answer": answer})
        
    except Exception as e:
        print(f"Error processing VQA request: {str(e)}")
        return JSONResponse(
            content={"error": f"Failed to process request: {str(e)}"}, 
            status_code=500
        )
async def inner_general_post(
    prompt: str,
    images: List[UploadFile],
    audios: List[UploadFile],
    url:  str
):
    print(f"Processing request to {url} with prompt: {prompt}")
    # Step 1: Analyze the inputs
    if should_relay(prompt, images, audios):
        # Step 2: Rebuild multipart form
        files = []

        # Attach images
        for img in images:
            content = await img.read()
            files.append(("images", (img.filename, content, img.content_type)))

        # Attach audios
        for audio in audios:
            content = await audio.read()
            files.append(("audios", (audio.filename, content, audio.content_type)))
        # Attach prompt as form field
        data = {'prompt': prompt}
        print(f"Sending files")
        # Step 3: Send to target
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data=data, files=files)
        print(f"Response from {url}: {response.status_code} - {response.text}")
        # Step 4: Return response from target
        return response
    # Step 5: Handle locally if not relayed
    return JSONResponse(
        content={"error": "Inputs do not meet relay criteria."},
        status_code=400
    )
def should_relay(prompt: str, images: List[UploadFile], audios: List[UploadFile]) -> bool:
    return True