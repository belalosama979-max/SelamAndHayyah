const fs = require('fs');

function replaceInFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  if(!content.includes('import AvatarDisplay')) {
    if (file === 'src/App.jsx') {
      content = 'import AvatarDisplay from \'./components/AvatarDisplay\';\n' + content;
    } else {
      content = 'import AvatarDisplay from \'./AvatarDisplay\';\n' + content;
    }
  }

  // App.jsx
  content = content.replace(/<span style={{ fontSize: '1\.2rem' }}>{p\.avatar}<\/span>/g, '<AvatarDisplay avatar={p.avatar} size="1.2rem" />');
  
  // AdminPanel.jsx
  content = content.replace(/<td style={{ padding: '0\.75rem', fontSize: '1\.25rem' }}>{player\.avatar}<\/td>/g, '<td style={{ padding: \'0.75rem\', textAlign: \'center\' }}><AvatarDisplay avatar={player.avatar} size="1.5rem" /></td>');
  
  // Board.jsx
  content = content.replace(/{player\.avatar \|\| player\.name\.charAt\(0\)}/g, '<AvatarDisplay avatar={player.avatar || player.name.charAt(0)} size="1em" />');
  content = content.replace(/{activePlayer\.avatar} {activePlayer\.name}/g, '<div style={{display: \'flex\', alignItems: \'center\', gap: \'0.5rem\'}}><AvatarDisplay avatar={activePlayer.avatar} size="1.2rem" /> <span>{activePlayer.name}</span></div>');
  content = content.replace(/<span style={{ fontWeight: 800 }}>{p\.rank}\. {p\.avatar} {p\.name}<\/span>/g, '<span style={{ fontWeight: 800, display: \'flex\', alignItems: \'center\', gap: \'0.4rem\' }}>{p.rank}. <AvatarDisplay avatar={p.avatar} size="1.2rem" /> {p.name}</span>');

  // LeaderboardView.jsx
  content = content.replace(/<div style={{ fontSize: '2rem' }}>{sortedPlayers\[1\]\.avatar}<\/div>/g, '<div><AvatarDisplay avatar={sortedPlayers[1].avatar} size="2.5rem" /></div>');
  content = content.replace(/<div style={{ fontSize: '2\.5rem' }}>{sortedPlayers\[0\]\.avatar}<\/div>/g, '<div><AvatarDisplay avatar={sortedPlayers[0].avatar} size="3rem" /></div>');
  content = content.replace(/<div style={{ fontSize: '2rem' }}>{sortedPlayers\[2\]\.avatar}<\/div>/g, '<div><AvatarDisplay avatar={sortedPlayers[2].avatar} size="2.5rem" /></div>');
  content = content.replace(/<span style={{ fontSize: '1\.5rem' }}>{player\.avatar}<\/span>/g, '<AvatarDisplay avatar={player.avatar} size="1.5rem" />');

  // ParentPortal.jsx
  content = content.replace(/<div style={{ fontSize: '2rem' }}>{sortedRoomPlayers\[1\]\.avatar}<\/div>/g, '<div><AvatarDisplay avatar={sortedRoomPlayers[1].avatar} size="2.5rem" /></div>');
  content = content.replace(/<div style={{ fontSize: '2\.5rem' }}>{sortedRoomPlayers\[0\]\.avatar}<\/div>/g, '<div><AvatarDisplay avatar={sortedRoomPlayers[0].avatar} size="3rem" /></div>');
  content = content.replace(/<div style={{ fontSize: '2rem' }}>{sortedRoomPlayers\[2\]\.avatar}<\/div>/g, '<div><AvatarDisplay avatar={sortedRoomPlayers[2].avatar} size="2.5rem" /></div>');
  content = content.replace(/<span style={{ fontSize: '1\.5rem', marginLeft: '0\.5rem' }}>{p\.avatar}<\/span>/g, '<AvatarDisplay avatar={p.avatar} size="1.5rem" style={{ marginLeft: \'0.5rem\' }} />');
  content = content.replace(/<div style={{ fontSize: '4rem', marginBottom: '1rem', textShadow: '0 4px 12px rgba\(0,0,0,0\.3\)' }}>\s*{student\.avatar}\s*<\/div>/g, '<div style={{ marginBottom: \'1rem\', display: \'flex\', justifyContent: \'center\' }}><AvatarDisplay avatar={student.avatar} size="5rem" style={{ boxShadow: \'0 4px 12px rgba(0,0,0,0.3)\' }} /></div>');
  
  // RoomSummary.jsx
  content = content.replace(/<span style={{ fontSize: '1\.15rem', marginLeft: '0\.35rem' }}>{player\.avatar \|\| '⭐'}<\/span>/g, '<AvatarDisplay avatar={player.avatar || \'⭐\'} size="1.15rem" style={{ marginLeft: \'0.35rem\' }} />');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated: ' + file);
  }
}

const files = [
  'src/App.jsx',
  'src/components/AdminPanel.jsx',
  'src/components/Board.jsx',
  'src/components/LeaderboardView.jsx',
  'src/components/ParentPortal.jsx',
  'src/components/RoomSummary.jsx'
];

files.forEach(replaceInFile);
