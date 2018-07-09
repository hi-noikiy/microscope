import * as React from 'react'
import { LinearProgress, Grid } from '@material-ui/core'
import { translate } from 'react-i18next'
import { IContainerProps, IBlock, TransactionFromServer } from '../../typings'
import { withObservables } from '../../contexts/observables'
import { fetch10Transactions } from '../../utils/fetcher'
import StaticCard from '../../components/StaticCard'
import BlockList from '../../components/HomepageLists/BlockList'
import TransactionList from '../../components/HomepageLists/TransactionList'
import ErrorNotification from '../../components/ErrorNotification'
// import HomeChart from '../../components/HomeChart'
import hideLoader from '../../utils/hideLoader'

const layout = require('../../styles/layout.scss')
// const texts = require('../../styles/text.scss')
const styles = require('./homepage.scss')

interface HomepageProps extends IContainerProps {}

const initState = {
  loading: 0,
  blocks: [] as IBlock[],
  transactions: [] as TransactionFromServer[],
  healthy: {
    count: '',
  },
  error: {
    code: '',
    message: '',
  },
}
type HomepageState = typeof initState
class Homepage extends React.Component<HomepageProps, HomepageState> {
  state = initState
  componentWillMount () {
    this.setState(state => ({ loading: state.loading + 1 }))
    this.props.CITAObservables.newBlockNumber(0, false)
      .finally(() => this.setState(state => ({ loading: state.loading - 1 })))
      .subscribe(
        // next
        blockNumber => this.blockHistory({ height: blockNumber, count: 10 }),
        // error
        error => this.setState(state => ({ error })),
        // complete
        () => {},
      )
    this.transactionHistory()
  }
  componentDidMount () {
    hideLoader()
  }
  private blkInfo = [
    { key: 'height', label: '出块高度' },
    { key: 'owner', label: '出块人' },
    { key: 'time', label: '出块时间' },
    { key: 'txCount', label: '交易量' },
  ]

  private blockHistory = ({ height, count }) => {
    this.props.CITAObservables.blockHistory({
      by: height,
      count,
    }).subscribe((blocks: IBlock[]) => {
      this.setState(state => ({
        blocks,
      }))
    })
  }
  private transactionHistory = () => {
    this.setState(state => ({ loading: state.loading + 1 }))
    fetch10Transactions().then(
      ({
        result,
      }: {
      result: {
      transactions: TransactionFromServer[]
      count: number
      }
      }) => {
        this.setState(state => ({
          loading: state.loading - 1,
          transactions: result.transactions,
        }))
      },
    )
  }
  private dismissNotification = e => {
    this.setState(state => ({ error: { message: '', code: '' } }))
  }
  render () {
    const { t } = this.props
    return (
      <React.Fragment>
        {this.state.loading ? (
          <LinearProgress classes={{ root: 'linearProgressRoot' }} />
        ) : null}
        <div className={layout.main}>
          <Grid container spacing={24}>
            <Grid item md={6} sm={12} xs={12}>
              <StaticCard
                icon="/microscopeIcons/blocks.png"
                title={t('Latest 10 Blocks')}
                page="blocks"
                className={styles.card}
              >
                <BlockList blocks={this.state.blocks} />
              </StaticCard>
            </Grid>
            <Grid item md={6} sm={12} xs={12}>
              <StaticCard
                icon="/microscopeIcons/transactions.png"
                title={t('Latest 10 Transactions')}
                page="transactions"
                className={styles.card}
              >
                <TransactionList transactions={this.state.transactions} />
              </StaticCard>
            </Grid>
          </Grid>
        </div>
        <ErrorNotification
          error={this.state.error}
          dismissNotification={this.dismissNotification}
        />
      </React.Fragment>
    )
  }
}

export default translate('microscope')(withObservables(Homepage))
