module.exports = {
  apps: [
    {
      name: 'music-caption',
      script: 'bash',
      args: [
        '-c',
        `
        source /opt/anaconda3/etc/profile.d/conda.sh &&
        cd ./music-caption &&
        if [ ! -d "./env" ]; then
          conda create --yes --prefix ./env python=3.11
        fi &&
        conda activate ./env &&
        pip install poetry &&
        poetry config virtualenvs.create false &&
        poetry install --no-root &&
        uvicorn main:app --host 0.0.0.0 --port 8102
        `
      ],
      autorestart: false
    }
    // {
    //   name :'music-analysis',
    //   script: 'bash',
    //   args: '-c "source /opt/anaconda3/etc/profile.d/conda.sh && cd ./MusicAnalyzer && conda activate musicanlys && uvicorn main:app --host 0.0.0.0 --port 8102"',
    // },
    // {
    //   name :'task-manager',
    //   script: 'bash',
    //   args: '-c "source /opt/anaconda3/etc/profile.d/conda.sh && cd ./AGDevTaskManager && conda activate AGDevTaskManager && uvicorn main:app --host 0.0.0.0 --port 8001"',
    // },
    // {
    //   name :'task-monitor',
    //   script: 'bash',
    //   args: '-c "cd ./agdevtaskmonitor && npm run dev -- --port 8002"',
    // }
  ]
}