import { Link } from 'react-router-dom'
import logo from '../../assets/brand/flexbox.png'

export default function Brand() {
  return <Link className="brand" to="/" aria-label="FlexBoard — beranda"><img src={logo} alt="" width="50" height="52" /><span><span>Flex</span>Board</span></Link>
}
